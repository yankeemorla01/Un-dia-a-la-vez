const { buildShortcut } = require('@joshfarrant/shortcuts-js');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://un-dia-a-la-vez-three.vercel.app';

function makeUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16).toUpperCase();
  });
}

// UUIDs for referencing outputs
const uuidTextInput = makeUUID();
const uuidVoiceMenu = makeUUID();
const uuidStyleMenu = makeUUID();
const uuidTtsUrl = makeUUID();
const uuidAudio = makeUUID();

const actions = [
  // Comment
  {
    WFWorkflowActionIdentifier: 'is.workflow.actions.comment',
    WFWorkflowActionParameters: {
      WFCommentActionText: 'Lector TTS — Un Día a la Vez\nEscribe cualquier texto y escúchalo con voces de IA. Elige personaje, idioma y emoción.',
    },
  },

  // 1. Ask for text input
  {
    WFWorkflowActionIdentifier: 'is.workflow.actions.ask',
    WFWorkflowActionParameters: {
      WFAskActionPrompt: '¿Qué quieres que lea?',
      WFInputType: 'Text',
      UUID: uuidTextInput,
    },
  },

  // 2. Choose voice/character
  {
    WFWorkflowActionIdentifier: 'is.workflow.actions.choosefrommenu',
    WFWorkflowActionParameters: {
      WFControlFlowMode: 0,
      WFMenuPrompt: '¿Con qué voz?',
      WFMenuItems: [
        '🇲🇽 Dalia (Mujer, México)',
        '🇲🇽 Jorge (Hombre, México)',
        '🇺🇸 Jenny (Mujer, English)',
        '🇺🇸 Guy (Hombre, English)',
        '🇧🇷 Francisca (Mujer, Português)',
        '🇫🇷 Denise (Mujer, Français)',
      ],
      UUID: uuidVoiceMenu,
    },
  },

  // --- Case: Dalia ---
  {
    WFWorkflowActionIdentifier: 'is.workflow.actions.choosefrommenu',
    WFWorkflowActionParameters: {
      WFControlFlowMode: 1,
      WFMenuItemTitle: '🇲🇽 Dalia (Mujer, México)',
    },
  },
  {
    WFWorkflowActionIdentifier: 'is.workflow.actions.text',
    WFWorkflowActionParameters: {
      WFTextActionText: 'es-MX-DaliaNeural',
      UUID: makeUUID(),
    },
  },
  {
    WFWorkflowActionIdentifier: 'is.workflow.actions.setvariable',
    WFWorkflowActionParameters: {
      WFVariableName: 'selectedVoice',
    },
  },

  // --- Case: Jorge ---
  {
    WFWorkflowActionIdentifier: 'is.workflow.actions.choosefrommenu',
    WFWorkflowActionParameters: {
      WFControlFlowMode: 1,
      WFMenuItemTitle: '🇲🇽 Jorge (Hombre, México)',
    },
  },
  {
    WFWorkflowActionIdentifier: 'is.workflow.actions.text',
    WFWorkflowActionParameters: {
      WFTextActionText: 'es-MX-JorgeNeural',
      UUID: makeUUID(),
    },
  },
  {
    WFWorkflowActionIdentifier: 'is.workflow.actions.setvariable',
    WFWorkflowActionParameters: {
      WFVariableName: 'selectedVoice',
    },
  },

  // --- Case: Jenny ---
  {
    WFWorkflowActionIdentifier: 'is.workflow.actions.choosefrommenu',
    WFWorkflowActionParameters: {
      WFControlFlowMode: 1,
      WFMenuItemTitle: '🇺🇸 Jenny (Mujer, English)',
    },
  },
  {
    WFWorkflowActionIdentifier: 'is.workflow.actions.text',
    WFWorkflowActionParameters: {
      WFTextActionText: 'en-US-JennyNeural',
      UUID: makeUUID(),
    },
  },
  {
    WFWorkflowActionIdentifier: 'is.workflow.actions.setvariable',
    WFWorkflowActionParameters: {
      WFVariableName: 'selectedVoice',
    },
  },

  // --- Case: Guy ---
  {
    WFWorkflowActionIdentifier: 'is.workflow.actions.choosefrommenu',
    WFWorkflowActionParameters: {
      WFControlFlowMode: 1,
      WFMenuItemTitle: '🇺🇸 Guy (Hombre, English)',
    },
  },
  {
    WFWorkflowActionIdentifier: 'is.workflow.actions.text',
    WFWorkflowActionParameters: {
      WFTextActionText: 'en-US-GuyNeural',
      UUID: makeUUID(),
    },
  },
  {
    WFWorkflowActionIdentifier: 'is.workflow.actions.setvariable',
    WFWorkflowActionParameters: {
      WFVariableName: 'selectedVoice',
    },
  },

  // --- Case: Francisca ---
  {
    WFWorkflowActionIdentifier: 'is.workflow.actions.choosefrommenu',
    WFWorkflowActionParameters: {
      WFControlFlowMode: 1,
      WFMenuItemTitle: '🇧🇷 Francisca (Mujer, Português)',
    },
  },
  {
    WFWorkflowActionIdentifier: 'is.workflow.actions.text',
    WFWorkflowActionParameters: {
      WFTextActionText: 'pt-BR-FranciscaNeural',
      UUID: makeUUID(),
    },
  },
  {
    WFWorkflowActionIdentifier: 'is.workflow.actions.setvariable',
    WFWorkflowActionParameters: {
      WFVariableName: 'selectedVoice',
    },
  },

  // --- Case: Denise ---
  {
    WFWorkflowActionIdentifier: 'is.workflow.actions.choosefrommenu',
    WFWorkflowActionParameters: {
      WFControlFlowMode: 1,
      WFMenuItemTitle: '🇫🇷 Denise (Mujer, Français)',
    },
  },
  {
    WFWorkflowActionIdentifier: 'is.workflow.actions.text',
    WFWorkflowActionParameters: {
      WFTextActionText: 'fr-FR-DeniseNeural',
      UUID: makeUUID(),
    },
  },
  {
    WFWorkflowActionIdentifier: 'is.workflow.actions.setvariable',
    WFWorkflowActionParameters: {
      WFVariableName: 'selectedVoice',
    },
  },

  // End menu
  {
    WFWorkflowActionIdentifier: 'is.workflow.actions.choosefrommenu',
    WFWorkflowActionParameters: {
      WFControlFlowMode: 2,
    },
  },

  // 3. Choose style/emotion
  {
    WFWorkflowActionIdentifier: 'is.workflow.actions.choosefrommenu',
    WFWorkflowActionParameters: {
      WFControlFlowMode: 0,
      WFMenuPrompt: '¿Con qué emoción?',
      WFMenuItems: [
        '😊 Alegre (cheerful)',
        '😢 Triste (sad)',
        '😠 Enojado (angry)',
        '🤩 Emocionado (excited)',
        '🤗 Amigable (friendly)',
        '🌙 Calmado (calm)',
        '💬 Conversacional (chat)',
        '🤫 Susurro (whispering)',
        '😱 Aterrado (terrified)',
        '🎤 Normal (neutral)',
      ],
      UUID: uuidStyleMenu,
    },
  },

  // --- Style cases ---
  ...[
    ['😊 Alegre (cheerful)', 'cheerful'],
    ['😢 Triste (sad)', 'sad'],
    ['😠 Enojado (angry)', 'angry'],
    ['🤩 Emocionado (excited)', 'excited'],
    ['🤗 Amigable (friendly)', 'friendly'],
    ['🌙 Calmado (calm)', 'calm'],
    ['💬 Conversacional (chat)', 'chat'],
    ['🤫 Susurro (whispering)', 'whispering'],
    ['😱 Aterrado (terrified)', 'terrified'],
    ['🎤 Normal (neutral)', ''],
  ].flatMap(([title, style]) => [
    {
      WFWorkflowActionIdentifier: 'is.workflow.actions.choosefrommenu',
      WFWorkflowActionParameters: {
        WFControlFlowMode: 1,
        WFMenuItemTitle: title,
      },
    },
    {
      WFWorkflowActionIdentifier: 'is.workflow.actions.text',
      WFWorkflowActionParameters: {
        WFTextActionText: style,
        UUID: makeUUID(),
      },
    },
    {
      WFWorkflowActionIdentifier: 'is.workflow.actions.setvariable',
      WFWorkflowActionParameters: {
        WFVariableName: 'selectedStyle',
      },
    },
  ]),

  // End style menu
  {
    WFWorkflowActionIdentifier: 'is.workflow.actions.choosefrommenu',
    WFWorkflowActionParameters: {
      WFControlFlowMode: 2,
    },
  },

  // 4. Build API URL
  {
    WFWorkflowActionIdentifier: 'is.workflow.actions.url',
    WFWorkflowActionParameters: {
      WFURLActionURL: `${BASE_URL}/api/tts`,
      UUID: uuidTtsUrl,
    },
  },

  // 5. POST to TTS API with JSON body using variables
  {
    WFWorkflowActionIdentifier: 'is.workflow.actions.downloadurl',
    WFWorkflowActionParameters: {
      WFHTTPMethod: 'POST',
      WFHTTPBodyType: 'JSON',
      WFJSONValues: {
        Value: {
          WFDictionaryFieldValueItems: [
            {
              WFItemType: 0,
              WFKey: { Value: { attachmentsByRange: {}, string: 'text' }, WFSerializationType: 'WFTextTokenString' },
              WFValue: {
                Value: {
                  attachmentsByRange: {
                    '{0, 1}': { OutputUUID: uuidTextInput, OutputName: 'Provided Input', Type: 'ActionOutput' },
                  },
                  string: '\uFFFC',
                },
                WFSerializationType: 'WFTextTokenString',
              },
            },
            {
              WFItemType: 0,
              WFKey: { Value: { attachmentsByRange: {}, string: 'voice' }, WFSerializationType: 'WFTextTokenString' },
              WFValue: {
                Value: {
                  attachmentsByRange: {
                    '{0, 1}': { Type: 'Variable', VariableName: 'selectedVoice' },
                  },
                  string: '\uFFFC',
                },
                WFSerializationType: 'WFTextTokenString',
              },
            },
            {
              WFItemType: 0,
              WFKey: { Value: { attachmentsByRange: {}, string: 'style' }, WFSerializationType: 'WFTextTokenString' },
              WFValue: {
                Value: {
                  attachmentsByRange: {
                    '{0, 1}': { Type: 'Variable', VariableName: 'selectedStyle' },
                  },
                  string: '\uFFFC',
                },
                WFSerializationType: 'WFTextTokenString',
              },
            },
          ],
        },
        WFSerializationType: 'WFDictionaryFieldValue',
      },
      UUID: uuidAudio,
    },
  },

  // 6. Play the audio
  {
    WFWorkflowActionIdentifier: 'is.workflow.actions.playsound',
    WFWorkflowActionParameters: {},
  },

  // 7. Show completion
  {
    WFWorkflowActionIdentifier: 'is.workflow.actions.notification',
    WFWorkflowActionParameters: {
      WFNotificationActionBody: '✅ Lectura completada',
      WFNotificationActionSound: false,
    },
  },
];

const shortcut = buildShortcut(actions, {
  name: 'Lector TTS',
});

const outputDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

const outputPath = path.join(outputDir, 'lector-tts.shortcut');
fs.writeFileSync(outputPath, shortcut);
console.log(`Shortcut generado: ${outputPath}`);
console.log(`Tamaño: ${shortcut.length} bytes`);
