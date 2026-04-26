const MOCK_TRANSCRIPT =
  "So I wanted to follow up on a few things from our last meeting. " +
  "First, you mentioned applying to the summer research program — the deadline for that is May 15th. " +
  "We also decided you'll switch your major from Biology to Cognitive Science by end of semester. " +
  "Make sure to schedule an appointment with the registrar's office to complete the paperwork. " +
  "I'm going to send you the link to the scholarship portal we discussed, and you should look into " +
  "the Peterson Fellowship — it's a great fit for your profile. " +
  "Let's plan to meet again in two weeks to review your updated course plan."

export async function transcribeAudio(_buffer: Buffer, _mimeType: string): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 800))
  return MOCK_TRANSCRIPT
}
