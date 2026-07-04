import React from 'react';

import { Sidebar, SidebarContent, SidebarStack } from '../../components/sidebar';
import { AboutTab, LogoutTab } from './sidebar';

export function LogoutSidebarNav() {
  return (
    <Sidebar>
      <SidebarContent
        scrollable={null}
        sticky={
          <SidebarStack>
            <AboutTab />
            <LogoutTab />
          </SidebarStack>
        }
      />
    </Sidebar>
  );
}
