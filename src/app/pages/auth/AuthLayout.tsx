import React from 'react';
import { Box, Spinner } from 'folds';
import { Outlet } from 'react-router-dom';

import { AutoDiscoveryInfo } from '../../cs-api';
import { SpecVersionsLoader } from '../../components/SpecVersionsLoader';
import { SpecVersionsProvider } from '../../hooks/useSpecVersions';
import { AutoDiscoveryInfoProvider } from '../../hooks/useAutoDiscoveryInfo';
import { AuthFlowsLoader } from '../../components/AuthFlowsLoader';
import { AuthFlowsProvider } from '../../hooks/useAuthFlows';
import { AuthServerProvider } from '../../hooks/useAuthServer';

const HOMESERVER_BASE_URL = 'http://localhost:8008';
const HOMESERVER_NAME = 'localhost:8008';

const HARDCODED_DISCOVERY: AutoDiscoveryInfo = {
  'm.homeserver': { base_url: HOMESERVER_BASE_URL },
};

function FullscreenSpinner() {
  return (
    <Box
      style={{ width: '100%', height: '100%', backgroundColor: '#000000' }}
      alignItems="Center"
      justifyContent="Center"
    >
      <Spinner size="600" variant="Secondary" />
    </Box>
  );
}

function FullscreenError({ message }: { message: string }) {
  return (
    <Box
      style={{ width: '100%', height: '100%', backgroundColor: '#000000', color: '#ff6666' }}
      alignItems="Center"
      justifyContent="Center"
    >
      <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '14px', margin: 0 }}>{message}</p>
    </Box>
  );
}

export function AuthLayout() {
  return (
    <Box style={{ width: '100%', height: '100%' }} direction="Column">
      <AuthServerProvider value={HOMESERVER_NAME}>
        <AutoDiscoveryInfoProvider value={HARDCODED_DISCOVERY}>
          <SpecVersionsLoader
            baseUrl={HOMESERVER_BASE_URL}
            fallback={() => <FullscreenSpinner />}
            error={() => (
              <FullscreenError message="Failed to connect to Matrix server at localhost:8008." />
            )}
          >
            {(specVersions) => (
              <SpecVersionsProvider value={specVersions}>
                <AuthFlowsLoader
                  fallback={() => <FullscreenSpinner />}
                  error={() => (
                    <FullscreenError message="Failed to load authentication configuration." />
                  )}
                >
                  {(authFlows) => (
                    <AuthFlowsProvider value={authFlows}>
                      <Outlet />
                    </AuthFlowsProvider>
                  )}
                </AuthFlowsLoader>
              </SpecVersionsProvider>
            )}
          </SpecVersionsLoader>
        </AutoDiscoveryInfoProvider>
      </AuthServerProvider>
    </Box>
  );
}
