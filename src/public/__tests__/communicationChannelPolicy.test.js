/* eslint-disable */

const {
  chooseCommunicationLane,
  requiresCommunicationApproval,
  CHANNELS
} = require('backend/communicationChannelPolicy');

describe('communicationChannelPolicy', () => {
  test('routes transactional notices to Wix triggered email', () => {
    const result = chooseCommunicationLane({ intent: 'transactional_notice' });
    expect(result.success).toBe(true);
    expect(result.lane).toBe(CHANNELS.WIX_TRIGGERED_EMAIL);
  });

  test('routes conversational replies to AgentMail', () => {
    const result = chooseCommunicationLane({ intent: 'conversation_reply' });
    expect(result.lane).toBe(CHANNELS.AGENTMAIL_INBOX);
  });

  test('routes urgent escalations to Twilio SMS', () => {
    const result = chooseCommunicationLane({ intent: 'urgent_escalation' });
    expect(result.lane).toBe(CHANNELS.TWILIO_SMS);
  });

  test('routes document collection to AgentMail first with Twilio escalation', () => {
    const result = chooseCommunicationLane({ intent: 'document_collection' });
    expect(result.lane).toBe(CHANNELS.AGENTMAIL_INBOX);
    expect(result.escalation).toEqual([
      CHANNELS.AGENTMAIL_INBOX,
      CHANNELS.TWILIO_SMS
    ]);
  });

  test('requires approval for first outbound contact and compliance cases', () => {
    expect(requiresCommunicationApproval({
      intent: 'conversation_reply',
      firstOutboundToNewContact: true
    })).toBe(true);

    expect(requiresCommunicationApproval({
      intent: 'compliance_case'
    })).toBe(true);
  });
});
