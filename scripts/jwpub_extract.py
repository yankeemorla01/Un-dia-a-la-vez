#!/usr/bin/env python3
"""
Extractor de texto bíblico desde archivos .jwpub (JW Library)

Uso:
    python3 jwpub_extract.py archivo.jwpub [--output salida.json]

Requisitos:
    pip3 install pycryptodome
"""

import argparse
import hashlib
import json
import os
import re
import sqlite3
import sys
import tempfile
import zipfile
import zlib
from html import unescape

from Crypto.Cipher import AES

# Constante XOR extraída del framework MEPSCommon de JW Library
# Se usa para derivar la clave AES y el IV a partir del SHA-256 de la clave
XOR_CONSTANT = bytes.fromhex(
    "11cbb5587e32846d4c26790c633da289"
    "f66fe5842a3a585ce1bc3a294af5ada7"
)

# Slugs estándar para los 66 libros de la Biblia
BOOK_SLUGS = {
    1: "genesis", 2: "exodo", 3: "levitico", 4: "numeros",
    5: "deuteronomio", 6: "josue", 7: "jueces", 8: "rut",
    9: "1-samuel", 10: "2-samuel", 11: "1-reyes", 12: "2-reyes",
    13: "1-cronicas", 14: "2-cronicas", 15: "esdras", 16: "nehemias",
    17: "ester", 18: "job", 19: "salmos", 20: "proverbios",
    21: "eclesiastes", 22: "cantar-de-los-cantares", 23: "isaias",
    24: "jeremias", 25: "lamentaciones", 26: "ezequiel", 27: "daniel",
    28: "oseas", 29: "joel", 30: "amos", 31: "abdias", 32: "jonas",
    33: "miqueas", 34: "nahum", 35: "habacuc", 36: "sofonias",
    37: "ageo", 38: "zacarias", 39: "malaquias", 40: "mateo",
    41: "marcos", 42: "lucas", 43: "juan", 44: "hechos",
    45: "romanos", 46: "1-corintios", 47: "2-corintios", 48: "galatas",
    49: "efesios", 50: "filipenses", 51: "colosenses",
    52: "1-tesalonicenses", 53: "2-tesalonicenses",
    54: "1-timoteo", 55: "2-timoteo", 56: "tito", 57: "filemon",
    58: "hebreos", 59: "santiago", 60: "1-pedro", 61: "2-pedro",
    62: "1-juan", 63: "2-juan", 64: "3-juan", 65: "judas",
    66: "apocalipsis",
}


def derive_aes_key_iv(key_string: str) -> tuple[bytes, bytes]:
    """
    Deriva la clave AES-128 y el IV a partir de un string.

    Proceso:
        1. SHA-256 del string (32 bytes)
        2. XOR con la constante hardcodeada (32 bytes)
        3. Primeros 16 bytes = AES key, siguientes 16 = IV
    """
    sha256 = hashlib.sha256(key_string.encode("utf-8")).digest()
    xored = bytes(sha256[i] ^ XOR_CONSTANT[i] for i in range(32))
    return xored[:16], xored[16:]


def decrypt_blob(blob: bytes, aes_key: bytes, aes_iv: bytes) -> bytes:
    """Descifra un BLOB: AES-128-CBC + PKCS7 unpad + zlib decompress."""
    cipher = AES.new(aes_key, AES.MODE_CBC, aes_iv)
    decrypted = cipher.decrypt(blob)
    # PKCS7 unpad
    pad_len = decrypted[-1]
    decrypted = decrypted[:-pad_len]
    # zlib decompress
    return zlib.decompress(decrypted)


def strip_html(html_bytes: bytes) -> str:
    """Convierte HTML a texto plano."""
    text = html_bytes.decode("utf-8")
    text = re.sub(r"<[^>]+>", "", text)
    text = unescape(text)
    return text.strip()


def extract_jwpub(jwpub_path: str, output_path: str):
    """Extrae el texto bíblico de un archivo .jwpub y lo guarda como JSON."""

    if not os.path.exists(jwpub_path):
        print(f"Error: no se encontró el archivo '{jwpub_path}'")
        sys.exit(1)

    with tempfile.TemporaryDirectory() as tmpdir:
        # 1. Descomprimir el .jwpub (es un ZIP)
        print(f"Extrayendo {jwpub_path}...")
        with zipfile.ZipFile(jwpub_path, "r") as zf:
            zf.extractall(tmpdir)

        # 2. Leer manifest.json
        manifest_path = os.path.join(tmpdir, "manifest.json")
        if not os.path.exists(manifest_path):
            print("Error: no se encontró manifest.json dentro del .jwpub")
            sys.exit(1)

        with open(manifest_path, "r", encoding="utf-8") as f:
            manifest = json.load(f)

        content_format = manifest.get("contentFormat", "")
        if content_format != "z-a":
            print(f"Advertencia: contentFormat es '{content_format}', se esperaba 'z-a'")

        pub = manifest["publication"]
        language = pub["language"]
        symbol = pub["symbol"]
        year = pub["year"]
        db_filename = pub["fileName"]

        # 3. Construir la clave de descifrado
        #    Formato: "{mepsLanguage}_{symbol}_{year}"
        key_string = f"{language}_{symbol}_{year}"
        print(f"Clave de descifrado: '{key_string}'")

        aes_key, aes_iv = derive_aes_key_iv(key_string)

        # 4. Abrir la base de datos
        db_path = os.path.join(tmpdir, db_filename)
        if not os.path.exists(db_path):
            # Buscar en subdirectorios
            for root, dirs, files in os.walk(tmpdir):
                if db_filename in files:
                    db_path = os.path.join(root, db_filename)
                    break

        if not os.path.exists(db_path):
            print(f"Error: no se encontró la base de datos '{db_filename}'")
            sys.exit(1)

        print(f"Base de datos: {db_filename}")
        db = sqlite3.connect(db_path)
        cur = db.cursor()

        # Verificar que tiene tablas de Biblia
        cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='BibleVerse'")
        if not cur.fetchone():
            print("Error: este .jwpub no contiene datos bíblicos (no tiene tabla BibleVerse)")
            sys.exit(1)

        # 5. Mapear versículos a libros/capítulos
        cur.execute("""
            SELECT BookNumber, ChapterNumber, FirstVerseId, LastVerseId
            FROM BibleChapter ORDER BY BookNumber, ChapterNumber
        """)
        chapters = cur.fetchall()

        verse_map = {}
        for book_num, chap_num, first_v, last_v in chapters:
            for vid in range(first_v, last_v + 1):
                verse_map[vid] = (book_num, chap_num)

        # 6. Descifrar todos los versículos
        cur.execute("""
            SELECT BibleVerseId, Label, Content
            FROM BibleVerse
            WHERE Content IS NOT NULL
            ORDER BY BibleVerseId
        """)
        rows = cur.fetchall()

        result = {}
        success = 0
        errors = 0

        total = len(rows)
        print(f"Descifrando {total} versículos...")

        for verse_id, label, blob in rows:
            if blob is None or verse_id not in verse_map:
                continue

            book_num, chap_num = verse_map[verse_id]
            slug = BOOK_SLUGS.get(book_num, f"libro-{book_num}")

            try:
                html = decrypt_blob(blob, aes_key, aes_iv)
                text = strip_html(html)

                # Número de versículo del label
                label_text = re.sub(r"<[^>]+>", "", label).strip()
                try:
                    verse_num = int(label_text)
                except ValueError:
                    verse_num = label_text

                if slug not in result:
                    result[slug] = {}
                chap_str = str(chap_num)
                if chap_str not in result[slug]:
                    result[slug][chap_str] = []

                result[slug][chap_str].append([verse_num, text])
                success += 1

            except Exception as e:
                errors += 1
                if errors <= 3:
                    print(f"  Error en versículo {verse_id}: {e}")

        db.close()

        # 7. Guardar JSON
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(result, f, ensure_ascii=False, indent=2)

        # 8. Resumen
        total_books = len(result)
        total_chapters = sum(len(ch) for ch in result.values())
        size_mb = os.path.getsize(output_path) / 1024 / 1024

        print(f"\n--- Resultado ---")
        print(f"Libros:      {total_books}")
        print(f"Capítulos:   {total_chapters}")
        print(f"Versículos:  {success}")
        if errors:
            print(f"Errores:     {errors}")
        print(f"Archivo:     {output_path} ({size_mb:.1f} MB)")

        # Muestra de verificación
        if "genesis" in result and "1" in result["genesis"]:
            v1 = result["genesis"]["1"][0]
            print(f"\nGénesis 1:{v1[0]} — {v1[1][:80]}...")


def main():
    parser = argparse.ArgumentParser(
        description="Extrae el texto bíblico de un archivo .jwpub de JW Library"
    )
    parser.add_argument("jwpub", help="Ruta al archivo .jwpub")
    parser.add_argument(
        "--output", "-o",
        default=None,
        help="Ruta del archivo JSON de salida (por defecto: biblia_<symbol>.json)",
    )
    args = parser.parse_args()

    if args.output is None:
        basename = os.path.splitext(os.path.basename(args.jwpub))[0]
        args.output = f"biblia_{basename}.json"

    extract_jwpub(args.jwpub, args.output)


if __name__ == "__main__":
    main()
