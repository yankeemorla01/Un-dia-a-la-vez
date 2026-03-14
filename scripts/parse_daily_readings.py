#!/usr/bin/env python3
"""Parse 2026 daily text RTF files and generate dailyReadings.json"""

import json
import re
import subprocess
import sys

BASE_DIR = "/Users/josecasadogenao/Un dia a la vez /dist"
OUTPUT = "/Users/josecasadogenao/Un dia a la vez /src/data/dailyReadings.json"

MONTHS_ES = {
    "enero": 0, "febrero": 1, "marzo": 2, "abril": 3,
    "mayo": 4, "junio": 5, "julio": 6, "agosto": 7,
    "septiembre": 8, "octubre": 9, "noviembre": 10, "diciembre": 11
}

DAYS_IN_MONTH_2026 = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

# Bible book name conversions (long form -> abbreviated)
BOOK_ABBREVS = [
    # Order matters: longer names first to avoid partial matches
    ("Cantar de los Cantares", "Cant."),
    ("Primera a los Corintios", "1 Cor."),
    ("Segunda a los Corintios", "2 Cor."),
    ("Primera a los Tesalonicenses", "1 Tes."),
    ("Segunda a los Tesalonicenses", "2 Tes."),
    ("Primera a Timoteo", "1 Tim."),
    ("Segunda a Timoteo", "2 Tim."),
    ("Primera de Pedro", "1 Ped."),
    ("Segunda de Pedro", "2 Ped."),
    ("Primera de Juan", "1 Juan"),
    ("Segunda de Juan", "2 Juan"),
    ("Tercera de Juan", "3 Juan"),
    ("Segundo de las Crónicas", "2 Crón."),
    ("Primero de las Crónicas", "1 Crón."),
    ("1 Crónicas", "1 Crón."),
    ("2 Crónicas", "2 Crón."),
    ("1 Samuel", "1 Sam."),
    ("2 Samuel", "2 Sam."),
    ("1 Reyes", "1 Rey."),
    ("2 Reyes", "2 Rey."),
    ("1 Corintios", "1 Cor."),
    ("2 Corintios", "2 Cor."),
    ("1 Tesalonicenses", "1 Tes."),
    ("2 Tesalonicenses", "2 Tes."),
    ("1 Timoteo", "1 Tim."),
    ("2 Timoteo", "2 Tim."),
    ("1 Pedro", "1 Ped."),
    ("2 Pedro", "2 Ped."),
    ("1 Juan", "1 Juan"),
    ("2 Juan", "2 Juan"),
    ("3 Juan", "3 Juan"),
    ("Génesis", "Gén."),
    ("Éxodo", "Éx."),
    ("Levítico", "Lev."),
    ("Números", "Núm."),
    ("Deuteronomio", "Deut."),
    ("Josué", "Jos."),
    ("Jueces", "Jue."),
    ("Esdras", "Esd."),
    ("Nehemías", "Neh."),
    ("Ester", "Est."),
    ("Salmos", "Sal."),
    ("Salmo", "Sal."),
    ("Proverbios", "Prov."),
    ("Eclesiastés", "Ecl."),
    ("Isaías", "Is."),
    ("Jeremías", "Jer."),
    ("Lamentaciones", "Lam."),
    ("Ezequiel", "Ezeq."),
    ("Daniel", "Dan."),
    ("Oseas", "Os."),
    ("Amós", "Amós"),
    ("Abdías", "Abd."),
    ("Jonás", "Jon."),
    ("Miqueas", "Miq."),
    ("Nahúm", "Nah."),
    ("Habacuc", "Hab."),
    ("Sofonías", "Sof."),
    ("Ageo", "Ageo"),
    ("Zacarías", "Zac."),
    ("Malaquías", "Mal."),
    ("Mateo", "Mat."),
    ("Marcos", "Mar."),
    ("Lucas", "Luc."),
    ("Juan", "Juan"),
    ("Hechos", "Hech."),
    ("Romanos", "Rom."),
    ("Gálatas", "Gál."),
    ("Efesios", "Efes."),
    ("Filipenses", "Filip."),
    ("Colosenses", "Col."),
    ("Tito", "Tito"),
    ("Filemón", "Filem."),
    ("Hebreos", "Heb."),
    ("Santiago", "Sant."),
    ("Judas", "Jud."),
    ("Apocalipsis", "Apoc."),
    ("Rut", "Rut"),
    ("Job", "Job"),
]


def convert_references(text):
    """Convert Bible references from long form to abbreviated form."""
    result = text

    # First, replace full book names with abbreviations
    for long_name, abbrev in BOOK_ABBREVS:
        result = result.replace(long_name, abbrev)

    # Convert "capítulo X versículo Y" patterns to "X:Y"
    # Pattern: "capítulo 14 versículo 20" -> "14:20"
    result = re.sub(
        r'\s+capítulo\s+(\d+)\s+versículos?\s+(\d+(?:\s*[,;]\s*\d+)*(?:\s*a\s+\d+)?)',
        r' \1:\2',
        result
    )

    # Handle "capítulo X versículos A a B" already captured above

    # Handle standalone "capítulo X" (no versículo following)
    # But be careful not to match if versículo follows later
    # Pattern: "capítulo 3" at end or before punctuation
    result = re.sub(
        r'\s+capítulo\s+(\d+)(?!\s+versícul)',
        r' \1',
        result
    )

    # Handle "Capítulo X versículo Y" (capital C, used for cross-references like "Capítulo 9 versículo 15")
    result = re.sub(
        r'Capítulo\s+(\d+)\s+versículos?\s+(\d+(?:\s*[,;]\s*\d+)*(?:\s*a\s+\d+)?)',
        r'\1:\2',
        result
    )

    # Handle standalone "Capítulo X"
    result = re.sub(
        r'Capítulo\s+(\d+)(?!\s+versícul)',
        r'\1',
        result
    )

    # Handle "versículo X" standalone (rare, like "Judas versículo 20")
    result = re.sub(
        r'\s+versículos?\s+(\d+(?:\s*[,;]\s*\d+)*(?:\s*a\s+\d+)?)',
        r' \1',
        result
    )

    # Clean up "página" references - these are in sources, keep as-is
    # Clean up double spaces
    result = re.sub(r'  +', ' ', result)

    return result


def extract_source(text):
    """Extract the source reference from the end of the commentary text.
    Sources look like: 'La Atalaya, abril de 2024 página 2 párrafos 1, 3'
    or: '¡Despertad!, No. 3 de 2024 página 5 párrafo 2'
    """
    # The source is at the very end of the text, typically starting with
    # a publication name like "La Atalaya" or "¡Despertad!"
    # Pattern: publication name, date, page info, paragraph info
    source_pattern = re.compile(
        r'((?:La Atalaya|¡Despertad!|Organizados para hacer la voluntad de Jehová|'
        r'El amor de Dios|"Ven, sé mi seguidor"|Manténganse en el amor de Dios|'
        r'Acerquémonos a Jehová|¿Qué nos enseña la Biblia\?|'
        r'Lecciones que .+?|Anuario de .+?|Carta de .+?|'
        r'(?:w|wp|g)\d+)[^.]*?(?:párrafos?\s+\d+(?:\s*[,;a]\s*\d+)*|pie de página|pág\.\s*\d+))\s*$'
    )

    # Try simpler approach: source starts with known publication names near end
    # Find the last occurrence of a publication name
    pub_names = [
        "La Atalaya,", "¡Despertad!,", "Organizados",
        "Ven, sé mi seguidor", "Manténganse en el amor",
        "Acerquémonos a Jehová", "¿Qué nos enseña",
    ]

    last_pos = -1
    for pub in pub_names:
        pos = text.rfind(pub)
        if pos > last_pos:
            last_pos = pos

    if last_pos > 0:
        # Check that this is near the end (within last ~200 chars)
        if len(text) - last_pos < 300:
            source = text[last_pos:].strip()
            commentary = text[:last_pos].strip()
            # Remove trailing period from commentary if present
            if commentary.endswith('.'):
                pass  # keep period
            return commentary, source

    # Fallback: try to find source by looking for "párrafo" near end
    match = re.search(r'(\.\s+)((?:[A-Z¡¿].+?párrafos?\s+\d+(?:\s*[,;a]\s*\d+)*))\s*$', text)
    if match:
        source = match.group(2).strip()
        commentary = text[:match.start() + 1].strip()
        return commentary, source

    # Last fallback: return everything as commentary
    return text.strip(), ""


def parse_month_file(month_num):
    """Parse a single month RTF file. month_num is 1-12."""
    filename = f"{BASE_DIR}/es26_S_{month_num:02d}.rtf"

    try:
        result = subprocess.run(
            ["textutil", "-convert", "txt", "-stdout", filename],
            capture_output=True, text=True, check=True
        )
        text = result.stdout
    except subprocess.CalledProcessError as e:
        print(f"Error converting {filename}: {e}", file=sys.stderr)
        return {}

    lines = text.strip().split('\n')
    entries = {}

    # Day of week names in Spanish
    day_names = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]

    # Parse entries - each entry starts with a date line like "Jueves 1 de enero"
    i = 0
    while i < len(lines):
        line = lines[i].strip()

        # Check if this line is a date header
        date_match = re.match(
            r'(?:' + '|'.join(day_names) + r')\s+(\d+)\s+de\s+(\w+)',
            line
        )

        # Also check for "Fecha de la Conmemoración" special format
        conmem_match = re.match(
            r'Fecha de la Conmemoración\s+\(tras la puesta del sol\)\s+(?:' + '|'.join(day_names).lower() + r'|' + '|'.join(day_names) + r')\s+(\d+)\s+de\s+(\w+)',
            line,
            re.IGNORECASE
        )
        if conmem_match and not date_match:
            date_match = conmem_match

        if date_match:
            day = int(date_match.group(1))
            month_name = date_match.group(2).lower()
            month_idx = MONTHS_ES.get(month_name)

            if month_idx is None:
                print(f"Warning: Unknown month '{month_name}' in line: {line}", file=sys.stderr)
                i += 1
                continue

            # Next line is the Bible verse/text
            i += 1
            if i >= len(lines):
                break
            verse_line = lines[i].strip()

            # Next line(s) are the commentary - collect until next date header
            # or special lines like "Lectura bíblica" or "Fecha de la Conmemoración"
            i += 1
            commentary_lines = []
            while i < len(lines):
                next_line = lines[i].strip()
                if not next_line:
                    i += 1
                    continue

                # Check if next line is a new date header
                is_date = re.match(
                    r'(?:' + '|'.join(day_names) + r')\s+\d+\s+de\s+\w+',
                    next_line
                )
                if is_date:
                    break

                # Check for "Lectura bíblica" (skip these lines)
                if next_line.startswith("Lectura bíblica"):
                    i += 1
                    continue
                # "Fecha de la Conmemoración" is a date header - break so it gets processed
                if next_line.startswith("Fecha de la Conmemoración"):
                    break

                commentary_lines.append(next_line)
                i += 1

            full_commentary = ' '.join(commentary_lines)

            # Extract source from commentary
            commentary_text, source = extract_source(full_commentary)

            # Convert Bible references
            verse_text = convert_references(verse_line)
            commentary_text = convert_references(commentary_text)
            source = convert_references(source)

            key = f"2026-{month_idx}-{day}"
            entries[key] = {
                "text": verse_text,
                "commentary": commentary_text,
                "source": source
            }
        else:
            i += 1

    return entries


def main():
    all_entries = {}

    for month in range(1, 13):
        entries = parse_month_file(month)
        print(f"Month {month:2d}: {len(entries)} entries")
        all_entries.update(entries)

    print(f"\nTotal entries: {len(all_entries)}")

    # Verify all days are present
    import calendar
    missing = []
    for month_idx in range(12):
        month_num = month_idx + 1
        days = DAYS_IN_MONTH_2026[month_idx]
        for day in range(1, days + 1):
            key = f"2026-{month_idx}-{day}"
            if key not in all_entries:
                missing.append(key)

    if missing:
        print(f"\nMissing entries ({len(missing)}):")
        for m in missing:
            print(f"  {m}")
    else:
        print("\nAll 365 days present!")

    # Sort keys for output
    def sort_key(k):
        parts = k.split('-')
        return (int(parts[0]), int(parts[1]), int(parts[2]))

    sorted_entries = dict(sorted(all_entries.items(), key=lambda x: sort_key(x[0])))

    with open(OUTPUT, 'w', encoding='utf-8') as f:
        json.dump(sorted_entries, f, ensure_ascii=False, indent=2)

    print(f"\nOutput written to {OUTPUT}")


if __name__ == "__main__":
    main()
