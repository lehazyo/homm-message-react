import React from "react";
import cn from "classnames";
import { RadioGroup } from "../RadioGroup/RadioGroup";
import { RadioButton } from "../RadioButton/RadioButton";
import { settingsStore } from "../App/App";
import { observer } from "mobx-react-lite";
import styles from "./HommVersion.module.css";

export const HommVersion = observer(() => {
    return (
        <div className={cn(styles.wrapper, "homm-style")}>
            <span className={styles.header}>Style:</span>
            <RadioGroup>
                <RadioButton
                    label="HoMM2"
                    name="style"
                    value="homm2"
                    set={() => { settingsStore.setHommVersion("homm2") }}
                    checked={settingsStore.hommVersion === "homm2"}
                />
                <RadioButton
                    label="HoMM3"
                    name="style"
                    value="homm3"
                    set={() => { settingsStore.setHommVersion("homm3") }}
                    checked={settingsStore.hommVersion === "homm3"}
                />
            </RadioGroup>
        </div>
    )
});
