import { ButtonGroup, Dropdown, DropdownButton, } from 'react-bootstrap';
import { HiDotsVertical } from "react-icons/hi";
import "../assets/css/uiComponent.css";
export const menuOption1 = [
    { label: "Pair Address", value: "pairAddress" },
    { label: "Pair Symbol", value: "symbol" },

    { label: "Token1 Name", value: "token1.name" },
    { label: "Token1 Symbol", value: "token1.symbol" },
    { label: "Token1 Address", value: "token1.address" },

    { label: "Token2 Name", value: "token2.name" },
    { label: "Token2 Symbol", value: "token2.symbol" },
    { label: "Token2 Address", value: "token2.address" },
];

export const MenuOptionDropDown = ({ handleMenuSelect, optionArr, menuIcon = <HiDotsVertical fontSize={"1.3rem"} color="#000" /> }) => {
    return (
        <DropdownButton
            as={ButtonGroup}
            key={"Light"}
            id={`dropdown-variants-Light`}
            variant="light"
            title={menuIcon}
            className="menuOptionComponent"
            onSelect={handleMenuSelect}
        >
            {
                optionArr?.map((item, i) => (
                    <Dropdown.Item key={i} eventKey={item.value}>
                        {item.label}
                    </Dropdown.Item>
                ))
            }
        </DropdownButton>
    );
};

export const LoaderComponent = () => {
    return (
        <div className='loaderComponent'>
            <div className="wifi-loader">
                <svg viewBox="0 0 86 86" className="circle-outer">
                    <circle r="40" cy="43" cx="43" className="back"></circle>
                    <circle r="40" cy="43" cx="43" className="front"></circle>
                    <circle r="40" cy="43" cx="43" className="new"></circle>
                </svg>
                <svg viewBox="0 0 60 60" className="circle-middle">
                    <circle r="27" cy="30" cx="30" className="back"></circle>
                    <circle r="27" cy="30" cx="30" className="front"></circle>
                </svg>
                <div data-text="Loading..." className="text"></div>
            </div>
        </div>
    )
}