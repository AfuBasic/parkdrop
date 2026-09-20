<?php

namespace Tests\Unit;

use App\Services\PhoneNormalizer;
use PHPUnit\Framework\TestCase;

class PhoneNormalizerTest extends TestCase
{
    public function test_it_normalizes_valid_nigerian_phone_numbers(): void
    {
        $this->assertEquals('+2348031234567', PhoneNormalizer::normalize('08031234567'));
        $this->assertEquals('+2348031234567', PhoneNormalizer::normalize('8031234567'));
        $this->assertEquals('+2348031234567', PhoneNormalizer::normalize('2348031234567'));
        $this->assertEquals('+2348031234567', PhoneNormalizer::normalize('+2348031234567'));

        $this->assertEquals('+2348031234567', PhoneNormalizer::normalize('0803 123 4567'));
        $this->assertEquals('+2348031234567', PhoneNormalizer::normalize('0803-123-4567'));
        $this->assertEquals('+2348031234567', PhoneNormalizer::normalize('+234 803 123 4567'));
    }

    public function test_it_rejects_invalid_phone_numbers(): void
    {
        $this->assertNull(PhoneNormalizer::normalize('123'));
        $this->assertNull(PhoneNormalizer::normalize('abcde'));
        $this->assertNull(PhoneNormalizer::normalize('00000000000'));
        $this->assertNull(PhoneNormalizer::normalize('08031234567890123'));
        $this->assertNull(PhoneNormalizer::normalize('080'));
    }

    public function test_it_formats_normalized_phone_numbers_for_display(): void
    {
        $this->assertEquals('0803 123 4567', PhoneNormalizer::formatForDisplay('+2348031234567'));
        $this->assertEquals('+15551234567', PhoneNormalizer::formatForDisplay('+15551234567'));
    }
}
