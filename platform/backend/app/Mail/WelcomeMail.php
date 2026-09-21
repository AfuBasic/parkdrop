<?php

namespace App\Mail;

use App\Models\Business;
use App\Models\PickupPoint;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class WelcomeMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    /** @var int Maximum delivery attempts */
    public int $tries = 3;

    /** @var array<int> Retry backoff in seconds */
    public array $backoff = [5, 30];

    /**
     * Create a new message instance.
     */
    public function __construct(
        public User $user,
        public Business $business,
        public ?PickupPoint $pickupPoint = null,
        public int $initialCredits = 20
    ) {}

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'You are ready to use ParkDrop',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.auth.welcome',
            text: 'emails.auth.welcome-text',
            with: [
                'firstName' => $this->user->first_name ?? 'there',
                'businessName' => $this->business->name,
                'pickupPointName' => $this->pickupPoint?->name ?? 'Main Location',
                'initialCredits' => $this->initialCredits,
                'appUrl' => config('app.frontend_url', 'https://parkdrop.com.ng'),
            ],
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
