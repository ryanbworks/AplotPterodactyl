import React, { memo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import tw from 'twin.macro';
import isEqual from 'react-fast-compare';
import styled from 'styled-components/macro';

interface Props {
    icon?: IconProp;
    title: string | React.ReactNode;
    className?: string;
    children: React.ReactNode;
}

const Box = styled.div`
    ${tw`rounded-2xl border border-zinc-800/50 overflow-hidden backdrop-blur-xl shadow-xl`};
    background: rgba(12, 12, 14, 0.45);
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
`;

const TitledGreyBox = ({ icon, title, children, className }: Props) => (
    <Box className={className}>
        <div css={tw`px-6 py-4 border-b border-zinc-800/50 flex items-center gap-2`} style={{ background: 'rgba(12, 12, 14, 0.6)' }}>
            {typeof title === 'string' ? (
                <p css={tw`text-[10px] font-bold uppercase tracking-widest text-zinc-500`}>
                    {icon && <FontAwesomeIcon icon={icon} css={tw`mr-2 text-green-500`} />}
                    {title}
                </p>
            ) : (
                title
            )}
        </div>
        <div css={tw`p-6`}>{children}</div>
    </Box>
);

export default memo(TitledGreyBox, isEqual);
