// Utility functions for expense split calculations with consistent rounding

/**
 * Calculate equal splits for an expense
 * Handles rounding to ensure total equals expense amount
 */
export const calculateEqualSplits = (amount, participantIds) => {
  if (participantIds.length === 0) {
    return [];
  }

  const splits = [];
  const perPersonAmount = amount / participantIds.length;
  
  // Round to 2 decimal places, but we need to handle rounding errors
  // We'll calculate with higher precision and then adjust the last split
  
  // Round down for all but the last one
  let totalAllocated = 0;
  
  for (let i = 0; i < participantIds.length - 1; i++) {
    const rounded = Math.floor(perPersonAmount * 100) / 100; // Round down to 2 decimals
    splits.push({
      participant: participantIds[i],
      amount: rounded,
    });
    totalAllocated += rounded;
  }
  
  // Last split gets the remainder to ensure total equals amount
  const lastAmount = Math.round((amount - totalAllocated) * 100) / 100;
  splits.push({
    participant: participantIds[participantIds.length - 1],
    amount: lastAmount,
  });
  
  return splits;
};

/**
 * Validate custom splits - ensure total equals expense amount
 */
export const validateCustomSplits = (amount, customSplits) => {
  const total = customSplits.reduce((sum, split) => sum + (split.amount || 0), 0);
  const difference = Math.abs(total - amount);
  
  // Allow small rounding differences (within 0.01)
  if (difference > 0.01) {
    return {
      valid: false,
      message: `Custom splits total ($${total.toFixed(2)}) must equal expense amount ($${amount.toFixed(2)})`,
    };
  }
  
  return { valid: true };
};

/**
 * Validate percentage splits - ensure they sum to 100%
 */
export const validatePercentageSplits = (percentageSplits) => {
  const total = percentageSplits.reduce((sum, split) => sum + (split.percentage || 0), 0);
  
  // Allow small rounding differences (within 0.01%)
  if (Math.abs(total - 100) > 0.01) {
    return {
      valid: false,
      message: `Percentage splits must sum to 100%. Current total: ${total.toFixed(2)}%`,
    };
  }
  
  return { valid: true };
};

/**
 * Calculate splits from percentages
 */
export const calculatePercentageSplits = (amount, percentageSplits) => {
  const splits = [];
  let totalAllocated = 0;
  
  for (let i = 0; i < percentageSplits.length - 1; i++) {
    const splitAmount = (amount * percentageSplits[i].percentage) / 100;
    const rounded = Math.floor(splitAmount * 100) / 100; // Round down
    splits.push({
      participant: percentageSplits[i].participant,
      amount: rounded,
      percentage: percentageSplits[i].percentage,
    });
    totalAllocated += rounded;
  }
  
  // Last split gets the remainder
  const lastAmount = Math.round((amount - totalAllocated) * 100) / 100;
  const lastPercentage = percentageSplits[percentageSplits.length - 1];
  splits.push({
    participant: lastPercentage.participant,
    amount: lastAmount,
    percentage: lastPercentage.percentage,
  });
  
  return splits;
};
