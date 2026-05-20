import React, { useCallback, useEffect, useState } from 'react';
import tw from 'twin.macro';
import VariableBox from '@/components/server/startup/VariableBox';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import getServerStartup from '@/api/swr/getServerStartup';
import Spinner from '@/components/elements/Spinner';
import { ServerError } from '@/components/elements/ScreenBlock';
import { httpErrorToHuman } from '@/api/http';
import { ServerContext } from '@/state/server';
import { useDeepCompareEffect } from '@/plugins/useDeepCompareEffect';
import Select from '@/components/elements/Select';
import isEqual from 'react-fast-compare';
import Input from '@/components/elements/Input';
import setSelectedDockerImage from '@/api/server/setSelectedDockerImage';
import InputSpinner from '@/components/elements/InputSpinner';
import useFlash from '@/plugins/useFlash';
import { Rocket, Info, Terminal, Box, ChevronRight } from 'lucide-react';
import { isMinecraftJavaServer } from '@/api/server/minecraft';

const MINECRAFT_VERSION_VARIABLES = [
    'MINECRAFT_VERSION',
    'VANILLA_VERSION',
    'MC_VERSION',
    'BUILD_NUMBER',
    'FORGE_VERSION',
    'SPONGE_VERSION',
    'BUNGEE_VERSION',
];

const StartupContainer = () => {
    const [loading, setLoading] = useState(false);
    const { clearFlashes, clearAndAddHttpError } = useFlash();

    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const server = ServerContext.useStoreState((state) => state.server.data!);
    const variables = ServerContext.useStoreState(
        ({ server }) => ({
            variables: server.data!.variables,
            invocation: server.data!.invocation,
            dockerImage: server.data!.dockerImage,
        }),
        isEqual
    );

    const { data, error, isValidating, mutate } = getServerStartup(uuid, {
        ...variables,
        dockerImages: { [variables.dockerImage]: variables.dockerImage },
    });

    const setServerFromState = ServerContext.useStoreActions((actions) => actions.server.setServerFromState);
    const isCustomImage =
        data &&
        !Object.values(data.dockerImages)
            .map((v) => v.toLowerCase())
            .includes(variables.dockerImage.toLowerCase());
    const visibleVariables =
        data && isMinecraftJavaServer(server)
            ? data.variables.filter((variable) => !MINECRAFT_VERSION_VARIABLES.includes(variable.envVariable))
            : data?.variables || [];

    useEffect(() => {
        mutate();
    }, []);

    useDeepCompareEffect(() => {
        if (!data) return;

        setServerFromState((s) => ({
            ...s,
            invocation: data.invocation,
            variables: data.variables,
        }));
    }, [data]);

    const updateSelectedDockerImage = useCallback(
        (v: React.ChangeEvent<HTMLSelectElement>) => {
            setLoading(true);
            clearFlashes('startup:image');

            const image = v.currentTarget.value;
            setSelectedDockerImage(uuid, image)
                .then(() => setServerFromState((s) => ({ ...s, dockerImage: image })))
                .catch((error) => {
                    console.error(error);
                    clearAndAddHttpError({ key: 'startup:image', error });
                })
                .then(() => setLoading(false));
        },
        [uuid]
    );

    return !data ? (
        !error || (error && isValidating) ? (
            <Spinner centered size={Spinner.Size.LARGE} />
        ) : (
            <ServerError title={'Oops!'} message={httpErrorToHuman(error)} onRetry={() => mutate()} />
        )
    ) : (
        <ServerContentBlock title={'Configurações de Inicialização'} showFlashKey={'startup:image'}>
            <div className="flex-1 w-full max-w-[1600px] mx-auto relative z-10 flex flex-col">
                {/* Ambient Glows */}
                <div className="fixed top-[-10%] left-[-5%] w-[40%] h-[40%] rounded-full bg-purple-500/10 blur-[150px] pointer-events-none" />
                <div className="fixed bottom-[-10%] right-[10%] w-[30%] h-[30%] rounded-full bg-blue-500/5 blur-[120px] pointer-events-none" />

                <div css={tw`flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 relative z-10`}>
                    <div>
                        <h1 css={tw`text-3xl sm:text-4xl font-bold text-white tracking-tight flex items-center gap-3`}>
                            <Rocket size={32} className="text-purple-400" />
                            Inicialização
                        </h1>
                        <p css={tw`text-sm sm:text-base text-zinc-500 mt-2 flex items-center gap-1.5`}>
                            <Info size={16} />
                            Gerencie o comando de arranque e as variáveis de ambiente do seu servidor.
                        </p>
                    </div>
                </div>

                <div css={tw`grid grid-cols-1 lg:grid-cols-4 gap-6 mb-12 relative z-10`}>
                    <div css={tw`lg:col-span-3 bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 shadow-xl`}>
                        <div css={tw`flex items-center gap-2 text-sm font-semibold text-white uppercase tracking-wider mb-6 pb-4 border-b border-zinc-800/50`}>
                            <Terminal size={18} className="text-purple-400" />
                            Comando de Inicialização
                        </div>
                        <div className="group" css={tw`bg-zinc-950/80 border border-zinc-800 rounded-xl p-4 shadow-inner hover:border-purple-500/30 transition-all duration-300`}>
                            <p css={tw`font-mono text-sm text-zinc-200 break-all leading-relaxed tracking-wider`}>
                                <span className="text-purple-400 mr-2">$</span>
                                {data.invocation}
                            </p>
                        </div>
                        <p css={tw`mt-4 text-xs text-zinc-500 italic`}>
                            Este comando é gerado automaticamente com base nas variáveis configuradas abaixo.
                        </p>
                    </div>

                    <div css={tw`lg:col-span-1 bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 shadow-xl flex flex-col`}>
                        <div css={tw`flex items-center gap-2 text-sm font-semibold text-white uppercase tracking-wider mb-6 pb-4 border-b border-zinc-800/50`}>
                            <Box size={18} className="text-blue-400" />
                            Imagem Docker
                        </div>
                        {Object.keys(data.dockerImages).length > 1 && !isCustomImage ? (
                            <div css={tw`flex-1 flex flex-col`}>
                                <InputSpinner visible={loading}>
                                    <Select
                                        disabled={Object.keys(data.dockerImages).length < 2}
                                        onChange={updateSelectedDockerImage}
                                        defaultValue={variables.dockerImage}
                                    >
                                        {Object.keys(data.dockerImages).map((key) => (
                                            <option key={data.dockerImages[key]} value={data.dockerImages[key]}>
                                                {key}
                                            </option>
                                        ))}
                                    </Select>
                                </InputSpinner>
                                <p css={tw`text-xs text-zinc-500 mt-4 leading-relaxed`}>
                                    Esta é uma funcionalidade avançada que permite selecionar a imagem Docker a utilizar.
                                </p>
                            </div>
                        ) : (
                            <div css={tw`flex-1 flex flex-col`}>
                                <Input disabled readOnly value={variables.dockerImage} />
                                {isCustomImage && (
                                    <p css={tw`text-xs text-amber-500/80 mt-4 bg-amber-500/5 border border-amber-500/10 p-3 rounded-lg`}>
                                        Esta imagem foi definida manualmente por um administrador e não pode ser alterada.
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div css={tw`relative z-10`}>
                    <div css={tw`flex items-center gap-2 text-xl font-bold text-white mb-6`}>
                        Variáveis de Ambiente
                        <ChevronRight size={20} className="text-zinc-600" />
                    </div>
                    <div css={tw`grid gap-6 md:grid-cols-2 lg:grid-cols-3`}>
                        {visibleVariables.map((variable) => (
                            <VariableBox key={variable.envVariable} variable={variable} />
                        ))}
                    </div>
                </div>
            </div>
        </ServerContentBlock>
    );
};

export default StartupContainer;
