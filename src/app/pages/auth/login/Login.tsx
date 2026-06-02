import React, { useEffect, useMemo } from 'react';
import { Box, Text, color } from 'folds';
import { useSearchParams } from 'react-router-dom';
import { SSOAction, createClient } from 'matrix-js-sdk';
import { useAuthFlows } from '../../../hooks/useAuthFlows';
import { useAuthServer } from '../../../hooks/useAuthServer';
import { useParsedLoginFlows } from '../../../hooks/useParsedLoginFlows';
import { TokenLogin } from './TokenLogin';
import { getLoginPath } from '../../pathUtils';
import { usePathWithOrigin } from '../../../hooks/usePathWithOrigin';
import { LoginPathSearchParams } from '../../paths';
import { useAutoDiscoveryInfo } from '../../../hooks/useAutoDiscoveryInfo';
import { PasswordLoginForm } from './PasswordLoginForm';

const getLoginTokenSearchParam = () => {
  const parmas = new URLSearchParams(window.location.search);
  const loginToken = parmas.get('loginToken');
  return loginToken ?? undefined;
};

const useLoginSearchParams = (searchParams: URLSearchParams): LoginPathSearchParams =>
  useMemo(
    () => ({
      username: searchParams.get('username') ?? undefined,
      email: searchParams.get('email') ?? undefined,
      loginToken: searchParams.get('loginToken') ?? undefined,
    }),
    [searchParams]
  );

export function Login() {
  const server = useAuthServer();
  const { loginFlows } = useAuthFlows();
  const [searchParams] = useSearchParams();
  const loginSearchParams = useLoginSearchParams(searchParams);
  const ssoRedirectUrl = usePathWithOrigin(getLoginPath(server));
  const loginTokenForHashRouter = getLoginTokenSearchParam();
  const discovery = useAutoDiscoveryInfo();
  const baseUrl = discovery['m.homeserver'].base_url;

  const parsedFlows = useParsedLoginFlows(loginFlows.flows);

  const mx = useMemo(() => createClient({ baseUrl }), [baseUrl]);

  const ssoProvider = parsedFlows.sso?.identity_providers?.[0];
  const ssoUrl = mx.getSsoLoginUrl(
    ssoRedirectUrl,
    'sso',
    ssoProvider?.id,
    SSOAction.LOGIN
  );

  // If SSO is available and we don't already have a login token, redirect immediately.
  useEffect(() => {
    if (parsedFlows.sso && !loginSearchParams.loginToken && !loginTokenForHashRouter) {
      window.location.href = ssoUrl;
    }
  }, [parsedFlows.sso, loginSearchParams.loginToken, loginTokenForHashRouter, ssoUrl]);

  // SSO callback: token is present — let TokenLogin handle silently (it renders a full-page overlay)
  if (parsedFlows.token && loginSearchParams.loginToken) {
    return <TokenLogin token={loginSearchParams.loginToken} />;
  }
  if (parsedFlows.token && loginTokenForHashRouter) {
    return <TokenLogin token={loginTokenForHashRouter} />;
  }

  // SSO redirect is pending — render nothing (useEffect above will fire)
  if (parsedFlows.sso) {
    return null;
  }

  // Fallback: no SSO, show password form
  if (parsedFlows.password) {
    return (
      <Box direction="Column" gap="500">
        <Text size="H2" priority="400">
          Login
        </Text>
        <PasswordLoginForm
          defaultUsername={loginSearchParams.username}
          defaultEmail={loginSearchParams.email}
        />
      </Box>
    );
  }

  return (
    <Box direction="Column" gap="500">
      <Text style={{ color: color.Critical.Main }}>
        {`Login not available. No supported authentication method found on "${server}".`}
      </Text>
    </Box>
  );
}
