<?php

use App\Services\PhoneNormalizer;

test('it normalizes valid nigerian phone numbers', function () {
    // Standard formats
    expect(PhoneNormalizer::normalize('08031234567'))->toBe('+2348031234567');
    expect(PhoneNormalizer::normalize('8031234567'))->toBe('+2348031234567');
    expect(PhoneNormalizer::normalize('2348031234567'))->toBe('+2348031234567');
    expect(PhoneNormalizer::normalize('+2348031234567'))->toBe('+2348031234567');

    // With spaces and hyphens
    expect(PhoneNormalizer::normalize('0803 123 4567'))->toBe('+2348031234567');
    expect(PhoneNormalizer::normalize('0803-123-4567'))->toBe('+2348031234567');
    expect(PhoneNormalizer::normalize('+234 803 123 4567'))->toBe('+2348031234567');
});

test('it rejects invalid phone numbers', function () {
    expect(PhoneNormalizer::normalize('123'))->toBeNull();
    expect(PhoneNormalizer::normalize('abcde'))->toBeNull();
    expect(PhoneNormalizer::normalize('00000000000'))->toBeNull();
    expect(PhoneNormalizer::normalize('08031234567890123'))->toBeNull(); // Too long
    expect(PhoneNormalizer::normalize('080'))->toBeNull(); // Too short
});

test('it formats normalized phone numbers for display', function () {
    expect(PhoneNormalizer::formatForDisplay('+2348031234567'))->toBe('0803 123 4567');
    
    // If not a standard normalized format, return as is
    expect(PhoneNormalizer::formatForDisplay('+15551234567'))->toBe('+15551234567');
});
