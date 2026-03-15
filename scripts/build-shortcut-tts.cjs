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
const uuidAudio = makeUUID();

// GroupingIdentifiers for menus
const voiceMenuGroup = makeUUID();
const styleMenuGroup = makeUUID();

const voices = [
  { label: 'Dalia (Mujer, Mexico)', id: 'es-MX-DaliaNeural' },
  { label: 'Jorge (Hombre, Mexico)', id: 'es-MX-JorgeNeural' },
  { label: 'Jenny (Mujer, English)', id: 'en-US-JennyNeural' },
  { label: 'Guy (Hombre, English)', id: 'en-US-GuyNeural' },
  { label: 'Francisca (Mujer, Portugues)', id: 'pt-BR-FranciscaNeural' },
  { label: 'Denise (Mujer, Frances)', id: 'fr-FR-DeniseNeural' },
];

const styles = [
  { label: 'Alegre', id: 'cheerful' },
  { label: 'Triste', id: 'sad' },
  { label: 'Enojado', id: 'angry' },
  { label: 'Emocionado', id: 'excited' },
  { label: 'Amigable', id: 'friendly' },
  { label: 'Calmado', id: 'calm' },
  { label: 'Conversacional', id: 'chat' },
  { label: 'Susurro', id: 'whispering' },
  { label: 'Aterrado', id: 'terrified' },
  { label: 'Normal', id: '' },
];

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

  // 2. Voice menu - Open
  {
    WFWorkflowActionIdentifier: 'is.workflow.actions.choosefrommenu',
    WFWorkflowActionParameters: {
      WFControlFlowMode: 0,
      WFMenuPrompt: 'Con que voz?',
      WFMenuItems: voices.map(v => v.label),
      GroupingIdentifier: voiceMenuGroup,
    },
  },

  // Voice menu - Cases
  ...voices.flatMap(v => [
    {
      WFWorkflowActionIdentifier: 'is.workflow.actions.choosefrommenu',
      WFWorkflowActionParameters: {
        WFControlFlowMode: 1,
        WFMenuItemTitle: v.label,
        GroupingIdentifier: voiceMenuGroup,
      },
    },
    {
      WFWorkflowActionIdentifier: 'is.workflow.actions.text',
      WFWorkflowActionParameters: {
        WFTextActionText: v.id,
        UUID: makeUUID(),
      },
    },
    {
      WFWorkflowActionIdentifier: 'is.workflow.actions.setvariable',
      WFWorkflowActionParameters: {
        WFVariableName: 'selectedVoice',
      },
    },
  ]),

  // Voice menu - End
  {
    WFWorkflowActionIdentifier: 'is.workflow.actions.choosefrommenu',
    WFWorkflowActionParameters: {
      WFControlFlowMode: 2,
      GroupingIdentifier: voiceMenuGroup,
    },
  },

  // 3. Style menu - Open
  {
    WFWorkflowActionIdentifier: 'is.workflow.actions.choosefrommenu',
    WFWorkflowActionParameters: {
      WFControlFlowMode: 0,
      WFMenuPrompt: 'Con que emocion?',
      WFMenuItems: styles.map(s => s.label),
      GroupingIdentifier: styleMenuGroup,
    },
  },

  // Style menu - Cases
  ...styles.flatMap(s => [
    {
      WFWorkflowActionIdentifier: 'is.workflow.actions.choosefrommenu',
      WFWorkflowActionParameters: {
        WFControlFlowMode: 1,
        WFMenuItemTitle: s.label,
        GroupingIdentifier: styleMenuGroup,
      },
    },
    {
      WFWorkflowActionIdentifier: 'is.workflow.actions.text',
      WFWorkflowActionParameters: {
        WFTextActionText: s.id || ' ',
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

  // Style menu - End
  {
    WFWorkflowActionIdentifier: 'is.workflow.actions.choosefrommenu',
    WFWorkflowActionParameters: {
      WFControlFlowMode: 2,
      GroupingIdentifier: styleMenuGroup,
    },
  },

  // 4. Build API URL
  {
    WFWorkflowActionIdentifier: 'is.workflow.actions.url',
    WFWorkflowActionParameters: {
      WFURLActionURL: `${BASE_URL}/api/tts`,
      UUID: makeUUID(),
    },
  },

  // 5. POST to TTS API
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

  // 7. Done notification
  {
    WFWorkflowActionIdentifier: 'is.workflow.actions.notification',
    WFWorkflowActionParameters: {
      WFNotificationActionBody: 'Lectura completada',
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
console.log(`Tamano: ${shortcut.length} bytes`);
