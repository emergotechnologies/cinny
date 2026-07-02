import React from 'react';
import { Icon, Icons, Overlay, OverlayBackdrop, OverlayCenter } from 'folds';
import FocusTrap from 'focus-trap-react';
import { SidebarAvatar, SidebarItem, SidebarItemTooltip } from '../../../components/sidebar';
import { UseStateProvider } from '../../../components/UseStateProvider';
import { LogoutDialog } from '../../../components/LogoutDialog';
import { stopPropagation } from '../../../utils/keyboard';

export function LogoutTab() {
  return (
    <UseStateProvider initial={false}>
      {(logout, setLogout) => (
        <SidebarItem active={logout}>
          <SidebarItemTooltip tooltip="Logout">
            {(triggerRef) => (
              <SidebarAvatar as="button" ref={triggerRef} outlined onClick={() => setLogout(true)}>
                <Icon src={Icons.Power} filled={logout} />
              </SidebarAvatar>
            )}
          </SidebarItemTooltip>
          {logout && (
            <Overlay open backdrop={<OverlayBackdrop />}>
              <OverlayCenter>
                <FocusTrap
                  focusTrapOptions={{
                    onDeactivate: () => setLogout(false),
                    clickOutsideDeactivates: true,
                    escapeDeactivates: stopPropagation,
                  }}
                >
                  <LogoutDialog handleClose={() => setLogout(false)} />
                </FocusTrap>
              </OverlayCenter>
            </Overlay>
          )}
        </SidebarItem>
      )}
    </UseStateProvider>
  );
}
