import Sidebar from "../../components/sidebar/index";
import React from "react";

const layout = ({ children }: { children: React.ReactNode }) => {
    return (
        <div className="h-screen">
            <Sidebar id={"userid"} type="workspace" />
            <div className="ml-12 md:pl-[320px] mr-12">{children}</div>
        </div>
    );
};

export default layout;