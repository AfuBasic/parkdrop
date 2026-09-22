import React from 'react';
import { Smartphone } from 'lucide-react';
import type { RegisteredDevice } from '../account-types';
import { DeviceRow } from './DeviceRow';
import { AccountStrings } from '@/features/account/strings';

interface DeviceListProps {
  devices: RegisteredDevice[];
  onRevokeDevice: (deviceId: number) => Promise<void>;
  onRevokeAllOthers: () => Promise<void>;
  revokingDeviceId?: number | null;
  isRevokingOthers?: boolean;
}

export const DeviceList: React.FC<DeviceListProps> = ({
  devices,
  onRevokeDevice,
  onRevokeAllOthers,
  revokingDeviceId = null,
  isRevokingOthers = false,
}) => {
  // Filter out current device from this remote devices list
  const remoteDevices = devices.filter((d) => !d.is_current);
  const activeRemoteCount = remoteDevices.filter((d) => !d.is_revoked).length;

  return (
    <section
      aria-labelledby="other-devices-heading"
      className="bg-white rounded-[var(--pd-card-radius)] border border-[var(--pd-line-2)] p-5 shadow-sm"
    >
      <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-[var(--pd-line-2)] flex-wrap">
        <h2 id="other-devices-heading" className="text-[18px] font-extrabold text-[var(--pd-navy)] m-0">
          {AccountStrings.otherPhonesHeading}
        </h2>

        {activeRemoteCount > 0 && (
          <button
            type="button"
            onClick={onRevokeAllOthers}
            disabled={isRevokingOthers}
            className="min-h-[48px] px-2 text-[16px] font-extrabold text-[var(--pd-bad)] disabled:opacity-50 cursor-pointer"
          >
            {isRevokingOthers ? AccountStrings.revokingOthers : AccountStrings.revokeAllOthers}
          </button>
        )}
      </div>

      {remoteDevices.length === 0 ? (
        <div className="text-center py-6 px-4 rounded-[var(--pd-field-radius)] bg-[var(--pd-page-2)] border border-dashed border-[var(--pd-line)] flex flex-col items-center gap-2">
          <Smartphone className="w-7 h-7 text-[var(--pd-muted)]" strokeWidth={2} aria-hidden="true" />
          <p className="text-[16px] font-bold text-[var(--pd-navy)] m-0">{AccountStrings.onlyThisPhone}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {remoteDevices.map((device) => (
            <DeviceRow
              key={device.id}
              device={device}
              onRevoke={onRevokeDevice}
              isRevoking={revokingDeviceId === device.id}
            />
          ))}
        </div>
      )}
    </section>
  );
};
