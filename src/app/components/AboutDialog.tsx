import React, { forwardRef } from 'react';
import { Dialog, Header, config, Box, Text, Button } from 'folds';

type AboutDialogProps = {
  handleClose: () => void;
};
export const AboutDialog = forwardRef<HTMLDivElement, AboutDialogProps>(({ handleClose }, ref) => (
  <Dialog variant="Surface" ref={ref}>
    <Header
      style={{
        padding: `0 ${config.space.S200} 0 ${config.space.S400}`,
        borderBottomWidth: config.borderWidth.B300,
      }}
      variant="Surface"
      size="500"
    >
      <Box grow="Yes">
        <Text size="H4">About</Text>
      </Box>
    </Header>
    <Box style={{ padding: config.space.S400 }} direction="Column" gap="400">
      <Text size="T300">
        This application is built on{' '}
        <a href="https://github.com/cinnyapp/cinny" rel="noreferrer noopener" target="_blank">
          Cinny
        </a>
        , an open-source Matrix client.
      </Text>
      <Text size="T300">
        It is licensed under the{' '}
        <a
          href="https://www.gnu.org/licenses/agpl-3.0.html"
          rel="noreferrer noopener"
          target="_blank"
        >
          GNU Affero General Public License v3.0 (AGPL-3.0)
        </a>
        .
      </Text>
      <Text size="T300">
        The source code for this version is available at{' '}
        <a
          href="https://github.com/emergotechnologies/cinny"
          rel="noreferrer noopener"
          target="_blank"
        >
          github.com/emergotechnologies/cinny
        </a>
        .
      </Text>
      <Button variant="Secondary" fill="Soft" onClick={handleClose}>
        <Text size="B400">Close</Text>
      </Button>
    </Box>
  </Dialog>
));
