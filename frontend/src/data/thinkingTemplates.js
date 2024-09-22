const thinkingTemplates = [
    {
        name: "Artifact",
        xml: `
<plan>
  <task>Brief task summary</task>
  <artifactWorthy>Whether any content require artifact</artifactWorthy>
  <structure>
    <c1>[text]: Acknowledge question and introduce answer</c1>
    <c2>[artifact]: One sentence summary of main content (e.g., code)</c2>
    <c3>[text]: Explain or elaborate on c2</c3>
    <c4>[artifact]: One sentence summary of additional content if needed</c4>
    <c5>[text]: Explain or elaborate on c4</c5>
    <!-- Add more pairs if needed -->
  </structure>
</plan>`
    },
    {
        name: "Chain of Thought",
        xml: `
<chain_of_thought>
  <problem>{problem_statement}</problem>
  <initial_state>{initial_state}</initial_state>
  <steps>
    <step>{action1}</step>
    <step>{action2}</step>
    <!-- Add more steps as needed -->
  </steps>
  <final_answer>Only the final answer, no need to provide the step by step problem solving</final_answer>
</chain_of_thought>`
    },
    {
        name: "Chain of Thought (with counter-view)",
        xml: `
<chain_of_thought>
  <problem>{problem_statement}</problem>
  <initial_state>{initial_state}</initial_state>
  <steps>
    <step>{action1}</step>
    <!-- Add more steps as needed -->
  </steps>
  <contra_reasoning>
    <possible_flaw>{possible_flaw1}</possible_flaw>
    <!-- Add more possible flaws as needed -->
  </contra_reasoning>
  <adjusted_steps>
    <adjusted_step>{adjusted_action1}</adjusted_step>
    <!-- Add more adjusted steps as needed -->
  </adjusted_steps>
  <final_answer>Only the final answer, no need to provide the step by step problem solving</final_answer>
</chain_of_thought>`
    },
    {
        name: "Reflection",
        xml: `
<thinking_reflection_output>
  <thinking>Break down the problem, list steps, perform calculations, and explain reasoning</thinking>
  <reflection>Review previous thinking, identify errors or oversights, and propose corrections or improvements</reflection>
  <!-- Repeat thinking and reflection tags as needed -->
  <output>Summarize the process and state the final, verified answer</output>
</thinking_reflection_output>`
    },
    {
        name: "Role-play",
        xml: `
<role_play>
  <character>{character_name_or_type}</character>
  <character_analysis>
    <point>What are the key traits and background of this character?</point>
    <point>How would these traits influence their thoughts and actions?</point>
    <!-- Add more or less analysis points as needed -->
  </character_analysis>
  <scenario>{situation_or_context}</scenario>
  <response_considerations>
    <point>What would be in character for them to say or do?</point>
    <point>How might their background influence their reaction?</point>
    <point>What internal conflicts might they experience?</point>
    <!-- Include more or less considerations if necessary -->
  </response_considerations>
  <authenticity_check>How to ensure the response aligns with the character's established traits?</authenticity_check>
</role_play>`
    },

    // Add more templates here
];

export default thinkingTemplates;
