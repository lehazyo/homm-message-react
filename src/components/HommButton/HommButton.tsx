import React from "react";
import cn from "classnames";
import styles from "./HommButton.module.css";

type Props = {
    children: React.ReactElement | string,
    className?: string,
    onClick?: () => void,
}

export const HommButton = ({ children, className, onClick }: Props) => {
    return (
        <div onClick={onClick} className={cn(styles.wrapper, className)}>{children}</div>
    )
};
