async function checkFraud({ fromUser, toUser, amount }) {
  const forced = process.env.AI_FORCE_DECISION;
  if (forced === "APPROVE" || forced === "REVIEW" || forced === "BLOCK") {
    return { fraudScore: 0.99, decision: forced, reason: `Forced: ${forced}` };
  }

  const score = Math.random();
  let decision = "APPROVE";
  if (score >= 0.8) decision = "BLOCK";
  else if (score >= 0.6) decision = "REVIEW";

  return { fraudScore: Number(score.toFixed(2)), decision, reason: "Mock AI decision" };
}

module.exports = { checkFraud };