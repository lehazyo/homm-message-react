import React from "react";
import { observer } from "mobx-react-lite";
import styles from "./Checkbox.module.css";

type Props = {
    label: string,
    checked: boolean,
    onChange: (e: any) => void,
}

export const Checkbox = observer(({ label, checked, onChange }: Props) => {
    return (
        <label className={styles.wrapper}>
            <input type="checkbox" checked={checked} onChange={onChange} />
            <div className={styles.icon}></div>
            <span>{label}</span>
        </label>
    )
});
