import { Box, Flex } from "@radix-ui/themes";
import cx from "clsx";
import React from "react";
import { flex } from "wehere-frontend/src/utils/frontend";

import SideBarV2 from "../../containers/SideBarV2";

import TopBar from "./containers/TopBar";
import styles from "./index.module.scss";
import type { ActivePage } from "./types";

type Props = {
  className?: string;
  style?: React.CSSProperties;
  content?: React.ReactNode;
  children?: React.ReactNode;
  activePage?: ActivePage;
};

export default function ChatLayout({
  className,
  style,
  content,
  children = content,
  activePage,
}: Props) {
  return (
    <Flex
      className={cx(styles.container, className)}
      style={style}
      direction="row"
    >
      <Box className={styles.left} position="relative" {...flex.hard}>
        <SideBarV2 activePage={activePage} fill />
      </Box>
      <Flex direction="column" {...flex.soft}>
        <Box className={styles.top} {...flex.hard} position="relative">
          <TopBar fill />
        </Box>
        <Box className={styles.content} {...flex.soft}>
          {children}
        </Box>
      </Flex>
    </Flex>
  );
}
