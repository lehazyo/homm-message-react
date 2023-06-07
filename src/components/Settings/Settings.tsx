import React from "react";
import { observer } from "mobx-react-lite";
import { settingsStore } from "../App/App";
import { Message } from "../Message/Message";
import { Homm2Theme } from "../Homm2Theme";
import { PlayerColor } from "../PlayerColor/PlayerColor";
import { Download } from "../Download/Download";
import { InterfaceSelector } from "../InterfaceSelector/InterfaceSelector";
import { HommVersion } from "../HommVersion/HommVersion";
import { ExpandSettings } from "../ExpandSettings/ExpandSettings";
import styles from "./Settings.module.css";
import cn from "classnames";
import {ShareButton} from "../ShareButton/ShareButton";

export const Settings = observer(() => {
    const homm2theme = settingsStore.hommVersion === "homm2"
        ? <Homm2Theme />
        : null
    const playerColor = settingsStore.hommVersion === "homm3"
        ? <PlayerColor />
        : null;

    return (
        <div className={styles.wrapper}>
            <div className={styles.controls}>
                <Message />
                <div className={cn(styles.expandable, { [styles.expanded]: settingsStore.expandSettings })}>
                    <HommVersion />
                    {playerColor}
                    <InterfaceSelector />
                    {homm2theme}
                    <Download />
                </div>
                <div className={styles.expandShare}>
                    <ExpandSettings />
                    <ShareButton />
                </div>
            </div>
        </div>
    );
});
