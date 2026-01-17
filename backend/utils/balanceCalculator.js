// Utility functions for calculating balances and settlements

/**
 * Calculate net balances for all users in a group based on expenses
 * Returns a map of userId -> net balance (positive = owes them, negative = they owe)
 */
export const calculateNetBalances = (expenses, allUserIds) => {
  const balances = {};
  
  // Initialize balances to zero
  allUserIds.forEach(userId => {
    balances[userId.toString()] = 0;
  });

  // Process each expense
  expenses.forEach(expense => {
    const payerId = expense.payer._id ? expense.payer._id.toString() : expense.payer.toString();
    
    // Payer paid the full amount (positive balance for payer)
    if (balances[payerId] !== undefined) {
      balances[payerId] += expense.amount;
    }

    // Each split participant owes their share (negative balance for participants)
    expense.splits.forEach(split => {
      const participantId = split.participant._id 
        ? split.participant._id.toString() 
        : split.participant.toString();
      
      if (balances[participantId] !== undefined) {
        balances[participantId] -= split.amount || 0;
      }
    });
  });

  return balances;
};

/**
 * Generate "who owes whom" directional balances based on net balances
 * Returns array of { from, to, amount } showing who owes whom
 */
export const getDirectionalBalances = (netBalances, userIds) => {
  const directional = [];
  
  // Create lists of creditors (positive balance) and debtors (negative balance)
  const creditors = [];
  const debtors = [];
  
  userIds.forEach(userId => {
    const userIdStr = userId.toString();
    const balance = netBalances[userIdStr] || 0;
    
    if (balance > 0.01) {
      creditors.push({ userId: userIdStr, amount: balance });
    } else if (balance < -0.01) {
      debtors.push({ userId: userIdStr, amount: Math.abs(balance) });
    }
  });
  
  // Match debtors to creditors
  let debtorIndex = 0;
  let creditorIndex = 0;
  
  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const debtor = debtors[debtorIndex];
    const creditor = creditors[creditorIndex];
    
    const settlementAmount = Math.min(debtor.amount, creditor.amount);
    
    if (settlementAmount > 0.01) {
      directional.push({
        from: debtor.userId,
        to: creditor.userId,
        amount: settlementAmount,
      });
      
      debtor.amount -= settlementAmount;
      creditor.amount -= settlementAmount;
      
      if (debtor.amount < 0.01) {
        debtorIndex++;
      }
      if (creditor.amount < 0.01) {
        creditorIndex++;
      }
    }
  }
  
  return directional;
};

/**
 * Optimize settlement transactions to minimize number of payments
 * Uses a greedy approach: find largest creditor and largest debtor, settle between them
 */
export const optimizeSettlements = (netBalances, userMap) => {
  const settlements = [];
  const balances = { ...netBalances };
  
  // Continue until all balances are close to zero
  const threshold = 0.01;
  let iterations = 0;
  const maxIterations = 100; // Safety limit
  
  while (iterations < maxIterations) {
    // Find largest creditor (positive balance) and largest debtor (negative balance)
    let maxCreditor = null;
    let maxCreditorAmount = 0;
    let maxDebtor = null;
    let maxDebtorAmount = 0;
    
    Object.entries(balances).forEach(([userId, amount]) => {
      if (amount > maxCreditorAmount) {
        maxCreditorAmount = amount;
        maxCreditor = userId;
      }
      if (amount < maxDebtorAmount) {
        maxDebtorAmount = amount;
        maxDebtor = userId;
      }
    });
    
    // If no significant balances left, we're done
    if (!maxCreditor || !maxDebtor || 
        maxCreditorAmount < threshold || 
        Math.abs(maxDebtorAmount) < threshold) {
      break;
    }
    
    // Calculate settlement amount (minimum of what's owed and what's to be received)
    const settlementAmount = Math.min(maxCreditorAmount, Math.abs(maxDebtorAmount));
    
    if (settlementAmount < threshold) {
      break;
    }
    
    // Record settlement
    settlements.push({
      from: maxDebtor,
      to: maxCreditor,
      amount: settlementAmount,
      fromName: userMap[maxDebtor]?.name || userMap[maxDebtor]?.email || 'Unknown',
      toName: userMap[maxCreditor]?.name || userMap[maxCreditor]?.email || 'Unknown',
    });
    
    // Update balances
    balances[maxCreditor] -= settlementAmount;
    balances[maxDebtor] += settlementAmount;
    
    iterations++;
  }
  
  return settlements;
};

/**
 * Calculate balance summary for a group
 */
export const calculateBalanceSummary = (expenses, allUserIds, userMap) => {
  // Calculate net balances
  const netBalances = calculateNetBalances(expenses, allUserIds);
  
  // Calculate directional balances
  const directionalBalances = getDirectionalBalances(netBalances, allUserIds);
  
  // Optimize settlements
  const settlements = optimizeSettlements(netBalances, userMap);
  
  // Calculate totals
  const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  
  return {
    netBalances,
    directionalBalances,
    settlements,
    totalSpent,
  };
};
