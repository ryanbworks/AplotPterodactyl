import styled from 'styled-components/macro';
import tw, { theme } from 'twin.macro';

const SubNavigation = styled.div`
    ${tw`w-full bg-zinc-950/20 backdrop-blur-xl border-b border-zinc-800/50 shadow-lg overflow-x-auto sticky top-16 z-30`};

    & > div {
        ${tw`flex items-center text-sm mx-auto px-4 h-14`};
        max-width: 1600px;

        & > a,
        & > div {
            ${tw`inline-flex items-center justify-center py-2 px-4 text-zinc-400 no-underline whitespace-nowrap transition-all duration-300 rounded-xl font-medium mx-1 hover:text-zinc-100 hover:bg-zinc-800/40`};

            &.active {
                ${tw`text-green-500 bg-green-500/5 shadow-[0_0_15px_rgba(34,197,94,0.1)] border border-green-500/10`};
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
