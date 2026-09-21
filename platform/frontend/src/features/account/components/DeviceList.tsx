import React from 'react';
import type { RegisteredDevice } from '../account-types';
import { DeviceRow } from './DeviceRow';

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
    <section aria-labelledby="other-devices-heading" className="bg-white rounded-2xl border border-neutral-200/80 p-5 shadow-xs">
      <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-neutral-100 flex-wrap">
        <div>
          <h2 id="other-devices-heading" className="text-base font-semibold text-neutral-900 tracking-tight">
            Registered Devices & Sessions
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Manage other phones, tablets, or computers signed into your account
          </p>
        </div>

        {activeRemoteCount > 0 && (
          <button
            type="button"
            onClick={onRevokeAllOthers}
            disabled={isRevokingOthers}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 border border-rose-200 disabled:opacity-50 transition-colors focus:outline-hidden"
          >
            {isRevokingOthers ? 'Revoking others...' : 'Revoke all other devices'}
          </button>
        )}
      </div>

      {remoteDevices.length === 0 ? (
        <div className="text-center py-6 px-4 rounded-xl bg-neutral-50/60 border border-dashed border-neutral-200">
          <svg className="w-8 h-8 mx-auto text-neutral-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <p className="text-xs font-semibold text-neutral-700">No other active devices</p>
          <p className="text-[11px] text-neutral-400 mt-0.5">
            You are only signed in on this current browser device.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
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
