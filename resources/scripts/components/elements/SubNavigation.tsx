import styled from 'styled-components/macro';
import tw from 'twin.macro';

const SubNavigation = styled.div`
    ${tw`w-full bg-zinc-950/20 backdrop-blur-xl border-b border-zinc-800/50 shadow-lg overflow-x-auto sticky top-16 z-30`};

    & > div {
        ${tw`flex items-center text-sm mx-auto px-4 h-14`};
        max-width: 1600px;

        & > a,
        & > div {
            ${tw`inline-flex items-center justify-center py-2 px-4 text-zinc-400 no-underline whitespace-nowrap rounded-xl font-medium mx-1 border border-transparent hover:text-zinc-100 hover:bg-zinc-900/80 hover:border-zinc-800`};
            transform: translateY(0) scale(1);
            transition: color 150ms ease, background-color 150ms ease, border-color 150ms ease, box-shadow 180ms ease,
                transform 180ms ease;

            &:hover {
                transform: translateY(-1px);
            }

            &:focus,
            &:focus-visible,
            &:active {
                ${tw`outline-none`};
                box-shadow: none;
            }

            &:focus-visible {
                border-color: rgba(34, 197, 94, 0.35);
                box-shadow: 0 0 0 1px rgba(34, 197, 94, 0.18);
            }

            &.active {
                ${tw`text-green-400 bg-green-500/10 border-green-500/25`};
                transform: translateY(-1px) scale(1.01);
                box-shadow: inset 0 0 0 1px rgba(34, 197, 94, 0.04), 0 8px 22px rgba(34, 197, 94, 0.08);
            }

            & > svg {
                ${tw`mr-2 text-zinc-500 transition-colors`};
            }

            &.active > svg {
                ${tw`text-green-500`};
            }
        }
    }
`;

export default SubNavigation;
