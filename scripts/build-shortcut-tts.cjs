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

const uuidTextInput = makeUUID();
const uuidVoiceDict = makeUUID();
const uuidVoiceKeys = makeUUID();
const uuidVoiceChoice = makeUUID();
const uuidVoiceId = makeUUID();
const uuidStyleDict = makeUUID();
const uuidStyleKeys = makeUUID();
const uuidStyleChoice = makeUUID();
const uuidStyleId = makeUUID();
const uuidAudio = makeUUID();

function makeDictItems(entries) {
  return entries.map(([key, val]) => ({
    WFItemType: 0,
    WFKey: {
      Value: { attachmentsByRange: {}, string: key },
      WFSerializationType: 'WFTextTokenString',
    },
    WFValue: {
      Value: { attachmentsByRange: {}, string: val },
      WFSerializationType: 'WFTextTokenString',
    },
  }));
}

const actions = [
  // Comment
  {
    WFWorkflowActionIdentifier: 'is.workflow.actions.comment',
    WFWorkflowActionParameters: {
      WFCommentActionText: 'Lector TTS — Un Dia a la Vez\nEscribe cualquier texto y escuchalo con voces de IA.',
    },
  },

  // 1. Ask for text input
  {
    WFWorkflowActionIdentifier: 'is.workflow.actions.ask',
    WFWorkflowActionParameters: {
      WFAskActionPrompt: 'Que quieres que lea?',
      WFInputType: 'Text',
      UUID: uuidTextInput,
    },
  },

  // ========== VOICE SELECTION ==========

  // 2. Dictionary: voice labels -> voice IDs
  {
    WFWorkflowActionIdentifier: 'is.workflow.actions.dictionary',
    WFWorkflowActionParameters: {
      WFItems: {
        Value: {
          WFDictionaryFieldValueItems: makeDictItems([
            ['Dalia (Mujer, Mexico)', 'es-MX-DaliaNeural'],
            ['Jorge (Hombre, Mexico)', 'es-MX-JorgeNeural'],
            ['Jenny (Mujer, English)', 'en-US-JennyNeural'],
            ['Guy (Hombre, English)', 'en-US-GuyNeural'],
            ['Francisca (Mujer, Portugues)', 'pt-BR-FranciscaNeural'],
            ['Denise (Mujer, Frances)', 'fr-FR-DeniseNeural'],
          ]),
        },
        WFSerializationType: 'WFDictionaryFieldValue',
      },
      UUID: uuidVoiceDict,
    },
  },

  // 3. Get All Keys from voice dictionary
  {
    WFWorkflowActionIdentifier: 'is.workflow.actions.getvalueforkey',
    WFWorkflowActionParameters: {
      WFGetDictionaryValueType: 'All Keys',
      WFInput: {
        Value: { OutputUUID: uuidVoiceDict, OutputName: 'Dictionary', Type: 'ActionOutput' },
        WFSerializationType: 'WFTextTokenAttachment',
      },
      UUID: uuidVoiceKeys,
    },
  },

  // 4. Choose from List (voice)
  {
    WFWorkflowActionIdentifier: 'is.workflow.actions.choosefromlist',
    WFWorkflowActionParameters: {
      WFChooseFromListActionPrompt: 'Con que voz?',
      WFInput: {
        Value: { OutputUUID: uuidVoiceKeys, OutputName: 'Dictionary Value', Type: 'ActionOutput' },
        WFSerializationType: 'WFTextTokenAttachment',
      },
      UUID: uuidVoiceChoice,
    },
  },

  // 5. Get value for chosen voice key
  {
    WFWorkflowActionIdentifier: 'is.workflow.actions.getvalueforkey',
    WFWorkflowActionParameters: {
      WFGetDictionaryValueType: 'Value',
      WFDictionaryKey: {
        Value: {
          attachmentsByRange: {
            '{0, 1}': { OutputUUID: uuidVoiceChoice, OutputName: 'Chosen Item', Type: 'ActionOutput' },
          },
          string: '\uFFFC',
        },
        WFSerializationType: 'WFTextTokenString',
      },
      WFInput: {
        Value: { OutputUUID: uuidVoiceDict, OutputName: 'Dictionary', Type: 'ActionOutput' },
        WFSerializationType: 'WFTextTokenAttachment',
      },
      UUID: uuidVoiceId,
    },
  },

  // ========== STYLE SELECTION ==========

  // 6. Dictionary: style labels -> style IDs
  {
    WFWorkflowActionIdentifier: 'is.workflow.actions.dictionary',
    WFWorkflowActionParameters: {
      WFItems: {
        Value: {
          WFDictionaryFieldValueItems: makeDictItems([
            ['Alegre', 'cheerful'],
            ['Triste', 'sad'],
            ['Enojado', 'angry'],
            ['Emocionado', 'excited'],
            ['Amigable', 'friendly'],
            ['Calmado', 'calm'],
            ['Conversacional', 'chat'],
            ['Susurro', 'whispering'],
            ['Aterrado', 'terrified'],
            ['Normal', 'neutral'],
          ]),
        },
        WFSerializationType: 'WFDictionaryFieldValue',
      },
      UUID: uuidStyleDict,
    },
  },

  // 7. Get All Keys from style dictionary
  {
    WFWorkflowActionIdentifier: 'is.workflow.actions.getvalueforkey',
    WFWorkflowActionParameters: {
      WFGetDictionaryValueType: 'All Keys',
      WFInput: {
        Value: { OutputUUID: uuidStyleDict, OutputName: 'Dictionary', Type: 'ActionOutput' },
        WFSerializationType: 'WFTextTokenAttachment',
      },
      UUID: uuidStyleKeys,
    },
  },

  // 8. Choose from List (style)
  {
    WFWorkflowActionIdentifier: 'is.workflow.actions.choosefromlist',
    WFWorkflowActionParameters: {
      WFChooseFromListActionPrompt: 'Con que emocion?',
      WFInput: {
        Value: { OutputUUID: uuidStyleKeys, OutputName: 'Dictionary Value', Type: 'ActionOutput' },
        WFSerializationType: 'WFTextTokenAttachment',
      },
      UUID: uuidStyleChoice,
    },
  },

  // 9. Get value for chosen style key
  {
    WFWorkflowActionIdentifier: 'is.workflow.actions.getvalueforkey',
    WFWorkflowActionParameters: {
      WFGetDictionaryValueType: 'Value',
      WFDictionaryKey: {
        Value: {
          attachmentsByRange: {
            '{0, 1}': { OutputUUID: uuidStyleChoice, OutputName: 'Chosen Item', Type: 'ActionOutput' },
          },
          string: '\uFFFC',
        },
        WFSerializationType: 'WFTextTokenString',
      },
      WFInput: {
        Value: { OutputUUID: uuidStyleDict, OutputName: 'Dictionary', Type: 'ActionOutput' },
        WFSerializationType: 'WFTextTokenAttachment',
      },
      UUID: uuidStyleId,
    },
  },

  // ========== CALL TTS API ==========

  // 10. URL
  {
    WFWorkflowActionIdentifier: 'is.workflow.actions.url',
    WFWorkflowActionParameters: {
      WFURLActionURL: `${BASE_URL}/api/tts`,
      UUID: makeUUID(),
    },
  },

  // 11. POST to TTS
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
                    '{0, 1}': { OutputUUID: uuidVoiceId, OutputName: 'Dictionary Value', Type: 'ActionOutput' },
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
                    '{0, 1}': { OutputUUID: uuidStyleId, OutputName: 'Dictionary Value', Type: 'ActionOutput' },
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

  // 12. Play audio
  {
    WFWorkflowActionIdentifier: 'is.workflow.actions.playsound',
    WFWorkflowActionParameters: {},
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
console.log(`Tamano: ${shortcut.length} bytes`);
