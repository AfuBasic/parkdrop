<?php

namespace App\Services;

class PhoneNormalizer
{
    /**
     * Normalize a phone number to standard format (e.g. +234...).
     * Returns null if the number is obviously invalid.
     */
    public static function normalize(string $phone): ?string
    {
        // Strip everything except digits and plus
        $clean = preg_replace('/[^\d+]/', '', $phone);

        // If empty after cleaning
        if (empty($clean)) {
            return null;
        }

        // Handle various common Nigerian formats
        // 08031234567 -> 11 digits starting with 0
        if (preg_match('/^0([789][01]\d{8})$/', $clean, $matches)) {
            return '+234' . $matches[1];
        }

        // 8031234567 -> 10 digits starting with 7, 8, or 9
        if (preg_match('/^([789][01]\d{8})$/', $clean, $matches)) {
            return '+234' . $matches[1];
        }

        // 2348031234567 -> 13 digits starting with 234
        if (preg_match('/^234([789][01]\d{8})$/', $clean, $matches)) {
            return '+234' . $matches[1];
        }

        // +2348031234567 -> 14 chars starting with +234
        if (preg_match('/^\+234([789][01]\d{8})$/', $clean, $matches)) {
            return '+234' . $matches[1];
        }

        // If it doesn't match our recognized rules, return null
        return null;
    }

    /**
     * Format a normalized phone number for display.
     */
    public static function formatForDisplay(string $normalized): string
    {
        // Example: +2348031234567 -> 0803 123 4567
        if (preg_match('/^\+234(\d{3})(\d{3})(\d{4})$/', $normalized, $matches)) {
            return '0' . $matches[1] . ' ' . $matches[2] . ' ' . $matches[3];
        }

        return $normalized;
    }
}
