import React from "react";
import cn from "classnames";
import { observer } from "mobx-react-lite";
import { Settings } from "../Settings/Settings";
import { SettingsStore } from "../../store/SettingsStore";
import { Canvas } from "../Canvas/Canvas";
import styles from "./App.module.css";

export const settingsStore = new SettingsStore();

export const App = observer(() => {
    return (
        <div className={cn(styles.wrapper, settingsStore.hommVersion, { "expandSettings": settingsStore.expandSettings })}>
            <Settings />
            <Canvas />
        </div>
    )
});
