import { SanitizationResult } from '../types';

// Deterministic Email Regex
const REGEX_EMAIL = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

// Deterministic Phone Number Regex (supports standard international and US formats)
const REGEX_PHONE = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\b\d{3}[-.\s]\d{3}[-.\s]\d{4}\b/g;

export interface SanitizerOptions {
  privateNames?: string[];
  warnOnFreeTextKeywords?: boolean;
}

export function sanitizeText(
  inputText: string,
  options: SanitizerOptions = {}
): SanitizationResult {
  if (!inputText) {
    return {
      sanitizedText: '',
      removedItems: [],
    };
  }

  let text = inputText;
  const removedItems: SanitizationResult['removedItems'] = [];

  // 1. Deterministic Email Redaction
  text = text.replace(REGEX_EMAIL, (match) => {
    removedItems.push({
      type: 'email',
      original: match,
      replacement: '[EMAIL_REDACTED]',
    });
    return '[EMAIL_REDACTED]';
  });

  // 2. Deterministic Phone Number Redaction
  text = text.replace(REGEX_PHONE, (match) => {
    // Only redact if string contains digits
    if (/\d{7,}/.test(match.replace(/\D/g, ''))) {
      removedItems.push({
        type: 'phone',
        original: match,
        replacement: '[PHONE_REDACTED]',
      });
      return '[PHONE_REDACTED]';
    }
    return match;
  });

  // 3. User-Marked Private Names Redaction
  if (options.privateNames && options.privateNames.length > 0) {
    options.privateNames.forEach((name) => {
      const trimmed = name.trim();
      if (trimmed.length > 1) {
        const nameRegex = new RegExp(`\\b${escapeRegExp(trimmed)}\\b`, 'gi');
        text = text.replace(nameRegex, (match) => {
          removedItems.push({
            type: 'marked_name',
            original: match,
            replacement: '[NAME_REDACTED]',
          });
          return '[NAME_REDACTED]';
        });
      }
    });
  }

  // 4. Free-text warning generator
  let warningMessage: string | undefined;
  const sensitiveIndicators = ['password', 'ssn', 'credit card', 'secret', 'address', 'confidential'];
  const foundIndicators = sensitiveIndicators.filter((k) =>
    text.toLowerCase().includes(k)
  );
  if (foundIndicators.length > 0) {
    warningMessage = `Notice: Text contains potentially sensitive keywords (${foundIndicators.join(
      ', '
    )}). Verify all personal details are sanitized before approval.`;
  }

  return {
    sanitizedText: text,
    removedItems,
    warningMessage,
  };
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
