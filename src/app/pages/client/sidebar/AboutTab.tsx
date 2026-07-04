import React from 'react';
import { Icon, Icons, Overlay, OverlayBackdrop, OverlayCenter } from 'folds';
import FocusTrap from 'focus-trap-react';
import { SidebarAvatar, SidebarItem, SidebarItemTooltip } from '../../../components/sidebar';
import { UseStateProvider } from '../../../components/UseStateProvider';
import { AboutDialog } from '../../../components/AboutDialog';
import { stopPropagation } from '../../../utils/keyboard';

export function AboutTab() {
  return (
    <UseStateProvider initial={false}>
      {(about, setAbout) => (
        <SidebarItem active={about}>
          <SidebarItemTooltip tooltip="About">
            {(triggerRef) => (
              <SidebarAvatar as="button" ref={triggerRef} outlined onClick={() => setAbout(true)}>
                <Icon src={Icons.Info} filled={about} />
              </SidebarAvatar>
            )}
          </SidebarItemTooltip>
          {about && (
            <Overlay open backdrop={<OverlayBackdrop />}>
              <OverlayCenter>
                <FocusTrap
                  focusTrapOptions={{
                    onDeactivate: () => setAbout(false),
                    clickOutsideDeactivates: true,
                    escapeDeactivates: stopPropagation,
                  }}
                >
                  <AboutDialog handleClose={() => setAbout(false)} />
                </FocusTrap>
              </OverlayCenter>
            </Overlay>
          )}
        </SidebarItem>
      )}
    </UseStateProvider>
  );
}
