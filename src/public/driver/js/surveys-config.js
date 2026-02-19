(function () {
  window.SurveysConfig = {
    LABELS: {
      ORIENTATION: 'Orientation Check-In',
      DAY_7:       '7-Day Check-In',
      DAY_30:      '30-Day Check-In',
      EXIT:        'Exit Survey'
    },
    ICONS: {
      ORIENTATION: '🎯',
      DAY_7:       '📅',
      DAY_30:      '📊',
      EXIT:        '👋'
    },
    XP: {
      ORIENTATION: 25,
      DAY_7:       25,
      DAY_30:      100,
      EXIT:        25
    },
    QUESTIONS: {
      ORIENTATION: [
        { id: 'q1', text: 'Did the job description match reality?', type: 'scale_1_5' },
        { id: 'q2', text: 'Was orientation organized and informative?', type: 'scale_1_5' },
        { id: 'q3', text: 'Anything you wish they had covered?', type: 'text_optional' }
      ],
      DAY_7: [
        { id: 'q1', text: 'How was your first week on the road?', type: 'scale_1_5' },
        { id: 'q2', text: 'Are you getting the miles they promised?', type: 'yes_no' },
        { id: 'q3', text: 'How is your dispatcher treating you?', type: 'scale_1_5' }
      ],
      DAY_30: [
        { id: 'q1', text: 'Do you see yourself still here in a year?', type: 'scale_1_5' },
        { id: 'q2', text: 'Rate your dispatcher overall', type: 'scale_1_5' },
        { id: 'q3', text: 'Is the pay meeting your expectations?', type: 'scale_1_5' },
        { id: 'q4', text: 'Would you refer a friend to drive here?', type: 'yes_no' }
      ],
      EXIT: [
        { id: 'q1', text: "What best describes why you're leaving?", type: 'multiple_choice',
          options: ['Pay too low', 'Not enough miles', 'Dispatcher issues', 'Equipment problems',
                    'Home time', 'Better opportunity', 'Personal reasons', 'Other'] },
        { id: 'q2', text: 'Would you come back to this carrier in the future?', type: 'yes_no' },
        { id: 'q3', text: 'How would you rate your overall experience?', type: 'scale_1_5' },
        { id: 'q4', text: 'Any final message for the carrier?', type: 'text_optional' }
      ]
    }
  };
})();
