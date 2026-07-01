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
import { clientDefaultServer, useClientConfig } from '../../hooks/useClientConfig';

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
  const clientConfig = useClientConfig();
  const homeserverName = clientDefaultServer(clientConfig);
  const homeserverBaseUrl = clientConfig.homeserverBaseUrl ?? `https://${homeserverName}`;
  const discovery: AutoDiscoveryInfo = {
    'm.homeserver': { base_url: homeserverBaseUrl },
  };

  return (
    <Box style={{ width: '100%', height: '100%' }} direction="Column">
      <AuthServerProvider value={homeserverName}>
        <AutoDiscoveryInfoProvider value={discovery}>
          <SpecVersionsLoader
            baseUrl={homeserverBaseUrl}
            fallback={() => <FullscreenSpinner />}
            error={() => <FullscreenError message="Failed to connect to the Matrix server." />}
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
