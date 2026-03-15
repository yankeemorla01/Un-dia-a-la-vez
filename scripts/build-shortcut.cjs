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

const uuidApiCall = makeUUID();
const uuidAudioText = makeUUID();
const uuidAudioComm = makeUUID();

const actions = [
  // Comment
  {
    WFWorkflowActionIdentifier: 'is.workflow.actions.comment',
    WFWorkflowActionParameters: {
      WFCommentActionText: 'Texto del Día — Un Día a la Vez\nDescarga el texto bíblico diario y lo reproduce con voces de IA (Piper TTS).',
    },
  },

  // 1. URL for API
  {
    WFWorkflowActionIdentifier: 'is.workflow.actions.url',
    WFWorkflowActionParameters: {
      WFURLActionURL: `${BASE_URL}/api/daily-text`,
      UUID: makeUUID(),
    },
  },

  // 2. Get Contents of URL (JSON)
  {
    WFWorkflowActionIdentifier: 'is.workflow.actions.downloadurl',
    WFWorkflowActionParameters: {
      WFHTTPMethod: 'GET',
      UUID: uuidApiCall,
    },
  },

  // 3. Get "date" from dictionary
  {
    WFWorkflowActionIdentifier: 'is.workflow.actions.getvalueforkey',
    WFWorkflowActionParameters: {
      WFDictionaryKey: 'date',
      WFGetDictionaryValueType: 'Value',
      WFInput: {
        Value: { OutputUUID: uuidApiCall, OutputName: 'Contents of URL', Type: 'ActionOutput' },
        WFSerializationType: 'WFTextTokenAttachment',
      },
    },
  },

  // 4. Show notification with date
  {
    WFWorkflowActionIdentifier: 'is.workflow.actions.notification',
    WFWorkflowActionParameters: {
      WFNotificationActionBody: 'Examinemos las Escrituras — Reproduciendo...',
      WFNotificationActionSound: true,
    },
  },

  // 5. URL for text audio (Piper TTS - female voice)
  {
    WFWorkflowActionIdentifier: 'is.workflow.actions.url',
    WFWorkflowActionParameters: {
      WFURLActionURL: `${BASE_URL}/api/daily-text?format=audio&part=text`,
      UUID: makeUUID(),
    },
  },

  // 6. Download text audio
  {
    WFWorkflowActionIdentifier: 'is.workflow.actions.downloadurl',
    WFWorkflowActionParameters: {
      WFHTTPMethod: 'GET',
      UUID: uuidAudioText,
    },
  },

  // 7. Play text audio (female voice - Dalia)
  {
    WFWorkflowActionIdentifier: 'is.workflow.actions.playsound',
    WFWorkflowActionParameters: {},
  },

  // 8. URL for commentary audio (Piper TTS - male voice)
  {
    WFWorkflowActionIdentifier: 'is.workflow.actions.url',
    WFWorkflowActionParameters: {
      WFURLActionURL: `${BASE_URL}/api/daily-text?format=audio&part=commentary`,
      UUID: makeUUID(),
    },
  },

  // 9. Download commentary audio
  {
    WFWorkflowActionIdentifier: 'is.workflow.actions.downloadurl',
    WFWorkflowActionParameters: {
      WFHTTPMethod: 'GET',
      UUID: uuidAudioComm,
    },
  },

  // 10. Play commentary audio (male voice - Jorge)
  {
    WFWorkflowActionIdentifier: 'is.workflow.actions.playsound',
    WFWorkflowActionParameters: {},
  },

  // 11. Get "key" (day_key) from the API response to mark the day
  {
    WFWorkflowActionIdentifier: 'is.workflow.actions.getvalueforkey',
    WFWorkflowActionParameters: {
      WFDictionaryKey: 'key',
      WFGetDictionaryValueType: 'Value',
      WFInput: {
        Value: { OutputUUID: uuidApiCall, OutputName: 'Contents of URL', Type: 'ActionOutput' },
        WFSerializationType: 'WFTextTokenAttachment',
      },
      UUID: makeUUID(),
    },
  },

  // 12. Build the mark request URL
  {
    WFWorkflowActionIdentifier: 'is.workflow.actions.url',
    WFWorkflowActionParameters: {
      WFURLActionURL: `${BASE_URL}/api/marked`,
      UUID: makeUUID(),
    },
  },

  // 13. POST to mark today as completed
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
              WFKey: { Value: { attachmentsByRange: {}, string: 'day_key' }, WFSerializationType: 'WFTextTokenString' },
              WFValue: {
                Value: {
                  attachmentsByRange: {
                    '{0, 1}': { OutputUUID: uuidApiCall, OutputName: 'Contents of URL', Type: 'ActionOutput' },
                  },
                  string: '\uFFFC',
                },
                WFSerializationType: 'WFTextTokenString',
              },
            },
            {
              WFItemType: 4,
              WFKey: { Value: { attachmentsByRange: {}, string: 'marked' }, WFSerializationType: 'WFTextTokenString' },
              WFValue: { Value: true, WFSerializationType: 'WFNumberSubstitutableState' },
            },
          ],
        },
        WFSerializationType: 'WFDictionaryFieldValue',
      },
      UUID: makeUUID(),
    },
  },

  // 14. Get source to show at the end
  {
    WFWorkflowActionIdentifier: 'is.workflow.actions.getvalueforkey',
    WFWorkflowActionParameters: {
      WFDictionaryKey: 'source',
      WFGetDictionaryValueType: 'Value',
      WFInput: {
        Value: { OutputUUID: uuidApiCall, OutputName: 'Contents of URL', Type: 'ActionOutput' },
        WFSerializationType: 'WFTextTokenAttachment',
      },
    },
  },

  // 15. Show source
  {
    WFWorkflowActionIdentifier: 'is.workflow.actions.showresult',
    WFWorkflowActionParameters: {},
  },
];

const shortcut = buildShortcut(actions, {
  name: 'Texto del Día',
});

const outputPath = path.join(__dirname, '..', 'public', 'texto-del-dia.shortcut');
fs.writeFileSync(outputPath, shortcut);
console.log(`Shortcut generado: ${outputPath}`);
console.log(`Tamano: ${shortcut.length} bytes`);
