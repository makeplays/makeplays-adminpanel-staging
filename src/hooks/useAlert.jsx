import React from 'react';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { Images } from '../Images';

const MySwal = withReactContent(Swal);

const customIcons = {
    info: `<img src="${Images.infoIcon}" alt="info" style="width:100px;height:100px;">`,
    warning: `<img src="${Images.warningIcon}" alt="warning" style="width:100px;height:100px;">`,
    success: `<img src="${Images.successIcon}" alt="success" style="width:100px;height:100px;">`,
};

export const useAlert = () => {
    const showAlerConfig = ({
        title,
        text = '',
        icon,
        confirmButtonText = 'Done',
        confirmButtonClass = 'modelBtnOkStyles',
        showCancelButton = false,
        showConfirmButton = true,
        cancelButtonText = 'Cancel',
        cancelButtonClass = 'modelBtnCancelStyles',
        customComponent = null,
        modalClassName = '',
        onConfirm = () => { },
        onCancel = () => { },
    }) => {
        const hasCustomIcon = customIcons[icon];

        return MySwal.fire({
            title,
            theme: "dark",
            text: customComponent ? undefined : text,
            icon: hasCustomIcon ? undefined : icon,
            iconHtml: hasCustomIcon || undefined,
            showCancelButton,
            cancelButtonText,
            showConfirmButton,
            confirmButtonText,
            customClass: {
                popup: modalClassName,
                confirmButton: confirmButtonClass,
                cancelButton: cancelButtonClass,
            },
            buttonsStyling: false,
            reverseButtons: true,
            html: customComponent
                ? (
                    <>{React.cloneElement(customComponent, {
                        closeModal: () => Swal.close(),
                        confirm: () => {
                            Swal.clickConfirm();
                        },
                        cancel: () => {
                            Swal.clickCancel();
                        },
                    })}</>
                )
                : undefined,
        }).then((result) => {
            if (result.isConfirmed) {
                onConfirm(); // <-- callback on confirm
            } else if (result.dismiss === Swal.DismissReason.cancel) {
                onCancel(); // <-- callback on cancel
            }
        });
    };

    const showAlert = ({
        title,
        text = '',
        icon = 'success',
        confirmButtonText = 'Done',
        cancelButtonText = 'Cancel',
        showCancelButton = false,
        showConfirmButton = true,
        customComponent = null,
        modalClassName = '',
        onConfirm,
        onCancel,
    }) => {
        return showAlerConfig({
            title,
            text,
            icon,
            confirmButtonText,
            cancelButtonText,
            showCancelButton,
            showConfirmButton,
            customComponent,
            modalClassName,
            onConfirm,
            onCancel,
        });
    };

    return {
        showAlert,
    };
};