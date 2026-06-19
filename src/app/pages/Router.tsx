import React from 'react';
import {
  Outlet,
  Route,
  createBrowserRouter,
  createHashRouter,
  createRoutesFromElements,
  redirect,
} from 'react-router-dom';

import { ClientConfig } from '../hooks/useClientConfig';
import { AuthLayout, Login, Register, ResetPassword } from './auth';
import {
  DIRECT_PATH,
  EXPLORE_PATH,
  HOME_PATH,
  LOGIN_PATH,
  INBOX_PATH,
  REGISTER_PATH,
  RESET_PASSWORD_PATH,
  SPACE_PATH,
  _CREATE_PATH,
  _JOIN_PATH,
  _ROOM_PATH,
  _SEARCH_PATH,
  CREATE_PATH,
} from './paths';
import {
  getAppPathFromHref,
  getHomePath,
  getLoginPath,
  getOriginBaseUrl,
} from './pathUtils';
import { ClientBindAtoms, ClientLayout, ClientRoot } from './client';
import { HomeRouteRoomProvider, HomeSearch } from './client/home';
import { setAfterLoginRedirectPath } from './afterLoginRedirectPath';
import { Room } from '../features/room';
import { SingleRoomRedirect } from './client/SingleRoomRedirect';
import { PageRoot } from '../components/page';
import { ScreenSize } from '../hooks/useScreenSize';
import { ClientInitStorageAtom } from './client/ClientInitStorageAtom';
import { ClientNonUIFeatures } from './client/ClientNonUIFeatures';
import { AuthRouteThemeManager, UnAuthRouteThemeManager } from './ThemeManager';
import { ReceiveSelfDeviceVerification } from '../components/DeviceVerification';
import { AutoRestoreBackupOnVerification } from '../components/BackupRestore';
import { RoomSettingsRenderer } from '../features/room-settings';
import { ClientRoomsNotificationPreferences } from './client/ClientRoomsNotificationPreferences';
import { SpaceSettingsRenderer } from '../features/space-settings';
import { UserRoomProfileRenderer } from '../components/UserRoomProfileRenderer';
import { CreateRoomModalRenderer } from '../features/create-room';
import { HomeCreateRoom } from './client/home/CreateRoom';
import { CreateSpaceModalRenderer } from '../features/create-space';
import { SearchModalRenderer } from '../features/search';
import { getFallbackSession } from '../state/sessions';
import { CallStatusRenderer } from './CallStatusRenderer';
import { CallEmbedProvider } from '../components/CallEmbedProvider';

export const createRouter = (clientConfig: ClientConfig, _screenSize: ScreenSize) => {
  const { hashRouter } = clientConfig;

  const routes = createRoutesFromElements(
    <Route>
      <Route
        index
        loader={() => {
          if (getFallbackSession()) return redirect(getHomePath());
          const afterLoginPath = getAppPathFromHref(getOriginBaseUrl(), window.location.href);
          if (afterLoginPath) setAfterLoginRedirectPath(afterLoginPath);
          return redirect(getLoginPath());
        }}
      />
      <Route
        loader={() => {
          if (getFallbackSession()) {
            return redirect(getHomePath());
          }

          return null;
        }}
        element={
          <>
            <AuthLayout />
            <UnAuthRouteThemeManager />
          </>
        }
      >
        <Route path={LOGIN_PATH} element={<Login />} />
        <Route path={REGISTER_PATH} element={<Register />} />
        <Route path={RESET_PASSWORD_PATH} element={<ResetPassword />} />
      </Route>

      <Route
        loader={() => {
          const session = getFallbackSession();
          if (!session) {
            const afterLoginPath = getAppPathFromHref(
              getOriginBaseUrl(hashRouter),
              window.location.href
            );
            if (afterLoginPath) setAfterLoginRedirectPath(afterLoginPath);
            return redirect(getLoginPath());
          }
          return null;
        }}
        element={
          <AuthRouteThemeManager>
            <ClientRoot>
              <ClientInitStorageAtom>
                <ClientRoomsNotificationPreferences>
                  <ClientBindAtoms>
                    <ClientNonUIFeatures>
                      <CallEmbedProvider>
                        <ClientLayout nav={null}>
                          <Outlet />
                        </ClientLayout>
                        <CallStatusRenderer />
                      </CallEmbedProvider>
                      <SearchModalRenderer />
                      <UserRoomProfileRenderer />
                      <CreateRoomModalRenderer />
                      <CreateSpaceModalRenderer />
                      <RoomSettingsRenderer />
                      <SpaceSettingsRenderer />
                      <ReceiveSelfDeviceVerification />
                      <AutoRestoreBackupOnVerification />
                    </ClientNonUIFeatures>
                  </ClientBindAtoms>
                </ClientRoomsNotificationPreferences>
              </ClientInitStorageAtom>
            </ClientRoot>
          </AuthRouteThemeManager>
        }
      >
        <Route
          path={HOME_PATH}
          element={
            <PageRoot nav={null}>
              <Outlet />
            </PageRoot>
          }
        >
          <Route index element={<SingleRoomRedirect />} />
          <Route path={_CREATE_PATH} element={<HomeCreateRoom />} />
          <Route path={_JOIN_PATH} element={<p>join</p>} />
          <Route path={_SEARCH_PATH} element={<HomeSearch />} />
          <Route
            path={_ROOM_PATH}
            element={
              <HomeRouteRoomProvider>
                <Room />
              </HomeRouteRoomProvider>
            }
          />
        </Route>
        <Route path={DIRECT_PATH} loader={() => redirect(getHomePath())} />
        <Route path={`${DIRECT_PATH}/*`} loader={() => redirect(getHomePath())} />
        <Route path={SPACE_PATH} loader={() => redirect(getHomePath())} />
        <Route path={`${SPACE_PATH}/*`} loader={() => redirect(getHomePath())} />
        <Route path={EXPLORE_PATH} loader={() => redirect(getHomePath())} />
        <Route path={`${EXPLORE_PATH}/*`} loader={() => redirect(getHomePath())} />
        <Route path={CREATE_PATH} loader={() => redirect(getHomePath())} />
        <Route path={INBOX_PATH} loader={() => redirect(getHomePath())} />
        <Route path={`${INBOX_PATH}/*`} loader={() => redirect(getHomePath())} />
      </Route>
      <Route path="/*" element={<p>Page not found</p>} />
    </Route>
  );

  if (hashRouter?.enabled) {
    return createHashRouter(routes, { basename: hashRouter.basename });
  }
  return createBrowserRouter(routes, {
    basename: import.meta.env.BASE_URL,
  });
};
