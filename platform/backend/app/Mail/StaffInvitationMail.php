<?php

namespace App\Mail;

use App\Models\BusinessInvitation;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class StaffInvitationMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    /** @var int Maximum delivery attempts */
    public int $tries = 3;

    /** @var array<int> Retry backoff in seconds */
    public array $backoff = [10, 60];

    public function __construct(
        public BusinessInvitation $invitation,
        public ?string $rawToken = null
    ) {}

    public function envelope(): Envelope
    {
        $businessName = $this->invitation->business->name;

        return new Envelope(
            subject: "Invitation to join {$businessName} on ParkDrop",
        );
    }

    public function content(): Content
    {
        $frontendUrl = config('app.frontend_url', 'https://parkdrop.com.ng');
        $inviteUrl = rtrim($frontendUrl, '/').'/invite/'.$this->invitation->id;
        if ($this->rawToken) {
            $inviteUrl .= '?token='.$this->rawToken;
        }

        $roleLabels = [
            'owner' => 'Owner',
            'manager' => 'Manager',
            'attendant' => 'Attendant',
        ];

        return new Content(
            view: 'emails.auth.invitation',
            with: [
                'businessName' => $this->invitation->business->name,
                'inviterName' => $this->invitation->inviter?->first_name ?? 'A team member',
                'roleName' => $roleLabels[$this->invitation->role] ?? ucfirst($this->invitation->role),
                'inviteeEmail' => $this->invitation->email,
                'inviteUrl' => $inviteUrl,
                'expiryDays' => config('parkdrop.invitation_ttl_days', 7),
            ],
        );
    }

    /**
     * @return array<int, Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
