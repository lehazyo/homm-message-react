import React from "react";
import { observer } from "mobx-react-lite";
import { InputBlock } from "../InputBlock/InputBlock";
import { Checkbox } from "../Checkbox/Checkbox";
import { settingsStore } from "../App/App";
import styles from "./InterfaceSelector.module.css";

export const InterfaceSelector = observer(() => {
    const changeOkay = (e: any) => {
        settingsStore.setControlOkay(e.target.checked);
    };
    const changeCancel = (e: any) => {
        settingsStore.setControlCancel(e.target.checked);
    };
    const changeShadow = (e: any) => {
        settingsStore.setControlShadow(e.target.checked);
    };

    return (
        <InputBlock headerLabel="Include:" className={styles.wrapper}>
            <div className={styles.checkboxes}>
                <Checkbox checked={settingsStore.buttonOkay} label="Okay button" onChange={changeOkay} />
                <Checkbox checked={settingsStore.buttonCancel} label="Cancel button" onChange={changeCancel} />
                <Checkbox checked={settingsStore.showShadow} label="Shadow" onChange={changeShadow} />
            </div>
        </InputBlock>
    )
});
