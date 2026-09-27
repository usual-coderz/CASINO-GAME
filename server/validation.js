/**
 * PAYLOAD VALIDATION
 * Zod schemas for every client -> server event
 */

const { z } = require('zod');

// Bet payload
const betSchema = z.object({
  amount: z.number().positive().min(0.01).max(10000),
  autoCashout: z.number().positive().min(1.01).max(10000).optional()
});

// Cashout payload
const cashoutSchema = z.object({
  roundId: z.string().uuid(),
  targetMultiplier: z.number().positive().min(1.00)
});

// Set client seed
const setSeedSchema = z.object({
  clientSeed: z.string().min(1).max(128).regex(/^[a-fA-F0-9]+$/)
});

// Set display name
const setNameSchema = z.object({
  name: z.string().min(1).max(20).regex(/^[a-zA-Z0-9_\- ]+$/)
});

// Generic empty payload
const emptySchema = z.object({});

function validate(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new Error(result.error.errors.map(e => e.message).join(', '));
  }
  return result.data;
}

module.exports = {
  betSchema,
  cashoutSchema,
  setSeedSchema,
  setNameSchema,
  emptySchema,
  validate
};