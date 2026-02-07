/**
 * Shared logic for evaluating targeting rules and conditions
 */

/**
 * Evaluate a set of conditions against a context object
 * 
 * @param {Array} conditions - Array of { attribute, operator, value }
 * @param {Object} context - Data to evaluate against
 * @returns {boolean} True if all conditions match (AND logic)
 */
export function evaluateConditions(conditions, context) {
  if (!conditions || conditions.length === 0) return true;
  
  return conditions.every(condition => {
    const { attribute, operator, value } = condition;
    const actualValue = getNestedValue(context, attribute);
    
    if (actualValue === undefined || actualValue === null) return false;

    switch (operator) {
      case 'equals': return actualValue === value;
      case 'not_equals': return actualValue !== value;
      case 'in': return Array.isArray(value) && value.includes(actualValue);
      case 'not_in': return Array.isArray(value) && !value.includes(actualValue);
      case 'greater_than': return actualValue > value;
      case 'less_than': return actualValue < value;
      case 'contains': return typeof actualValue === 'string' && actualValue.includes(value);
      case 'starts_with': return typeof actualValue === 'string' && actualValue.startsWith(value);
      case 'ends_with': return typeof actualValue === 'string' && actualValue.endsWith(value);
      case 'regex': return new RegExp(value).test(actualValue);
      default: return false;
    }
  });
}

/**
 * Get nested value from object using dot notation
 */
export function getNestedValue(obj, path) {
  if (!path) return undefined;
  return path.split('.').reduce((acc, part) => {
    if (acc && typeof acc === 'object') return acc[part];
    return undefined;
  }, obj);
}
