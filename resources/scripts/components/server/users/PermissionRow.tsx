import styled from 'styled-components/macro';
import tw from 'twin.macro';
import Checkbox from '@/components/elements/Checkbox';
import React from 'react';
import { useStoreState } from 'easy-peasy';
import Label from '@/components/elements/Label';

const Container = styled.label`
    ${tw`flex items-center bg-zinc-950/30 border border-zinc-800/40 rounded-xl p-3 transition-all duration-300`};
    text-transform: none;

    &:not(.disabled) {
        ${tw`cursor-pointer`};

        &:hover {
            ${tw`border-green-500/30 bg-zinc-900/50 shadow-lg`};
            transform: translateY(-2px);
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4), 0 0 15px rgba(34, 197, 94, 0.05);
        }
    }

    &.disabled {
        ${tw`opacity-50`};
    }
`;

interface Props {
    permission: string;
    disabled: boolean;
}

const PermissionRow = ({ permission, disabled }: Props) => {
    const [key, pkey] = permission.split('.', 2);
    const permissions = useStoreState((state) => state.permissions.data);

    return (
        <Container htmlFor={`permission_${permission}`} className={disabled ? 'disabled' : undefined}>
            <div css={tw`mr-3 flex items-center`}>
                <Checkbox
                    id={`permission_${permission}`}
                    name={'permissions'}
                    value={permission}
                    css={tw`w-5 h-5 rounded-md border-zinc-700 bg-zinc-950 text-green-500 focus:ring-green-500/50 transition-all`}
                    disabled={disabled}
                />
            </div>
            <div css={tw`flex-1`}>
                <Label as={'p'} css={tw`text-sm font-semibold text-zinc-200 tracking-wide`}>
                    {pkey}
                </Label>
                {permissions[key].keys[pkey].length > 0 && (
                    <p css={tw`text-xs text-zinc-500 mt-0.5 leading-relaxed`}>{permissions[key].keys[pkey]}</p>
                )}
            </div>
        </Container>
    );
};

export default PermissionRow;
