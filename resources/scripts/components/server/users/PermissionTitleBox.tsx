import React, { memo, useCallback } from 'react';
import { useField } from 'formik';
import tw from 'twin.macro';
import Input from '@/components/elements/Input';
import isEqual from 'react-fast-compare';
import { ShieldCheck } from 'lucide-react';

interface Props {
    isEditable: boolean;
    title: string;
    permissions: string[];
    className?: string;
}

const PermissionTitleBox: React.FC<Props> = memo(({ isEditable, title, permissions, className, children }) => {
    const [{ value }, , { setValue }] = useField<string[]>('permissions');

    const onCheckboxClicked = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            if (e.currentTarget.checked) {
                setValue([...value, ...permissions.filter((p) => !value.includes(p))]);
            } else {
                setValue(value.filter((p) => !permissions.includes(p)));
            }
        },
        [permissions, value]
    );

    return (
        <div className={className} css={tw`bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 shadow-xl flex flex-col transition-all duration-300 hover:border-zinc-700/50`}>
            <div css={tw`flex items-center justify-between mb-4 pb-4 border-b border-zinc-800/50`}>
                <div css={tw`flex items-center gap-2 text-sm font-semibold text-white uppercase tracking-wider`}>
                    <ShieldCheck size={18} className="text-green-500" />
                    {title}
                </div>
                {isEditable && (
                    <Input
                        type={'checkbox'}
                        checked={permissions.every((p) => value.includes(p))}
                        onChange={onCheckboxClicked}
                        css={tw`w-5 h-5 rounded-md border-zinc-700 bg-zinc-950 text-green-500 focus:ring-green-500/50 transition-all cursor-pointer`}
                    />
                )}
            </div>
            <div css={tw`flex flex-col gap-2`}>
                {children}
            </div>
        </div>
    );
}, isEqual);

export default PermissionTitleBox;
