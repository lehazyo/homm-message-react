import React from "react";
import cn from "classnames";
import styles from "./InputBlock.module.css";

type Props = {
    className?: string,
    headerLabel: string,
    children?: React.ReactElement | null,
}

export const InputBlock = ({ className, headerLabel, children }: Props) => {
    return (
        <div className={cn(styles.wrapper, className)}>
            <div className={styles.header}>{headerLabel}</div>
            {children}
        </div>
    )
}