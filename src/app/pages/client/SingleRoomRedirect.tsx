import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Spinner } from 'folds';
import { useMatrixClient } from '../../hooks/useMatrixClient';
import { getHomeRoomPath } from '../pathUtils';

export function SingleRoomRedirect() {
  const mx = useMatrixClient();
  const navigate = useNavigate();

  useEffect(() => {
    const rooms = mx.getRooms();
    const firstRoom = rooms[0];
    if (firstRoom) {
      navigate(getHomeRoomPath(firstRoom.roomId), { replace: true });
    }
  }, [mx, navigate]);

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
