import React, { memo, useState } from 'react';
import { ServerEggVariable } from '@/api/server/types';
import { usePermissions } from '@/plugins/usePermissions';
import InputSpinner from '@/components/elements/InputSpinner';
import Input from '@/components/elements/Input';
import Switch from '@/components/elements/Switch';
import { debounce } from 'debounce';
import updateStartupVariable from '@/api/server/updateStartupVariable';
import useFlash from '@/plugins/useFlash';
import FlashMessageRender from '@/components/FlashMessageRender';
import getServerStartup from '@/api/swr/getServerStartup';
import Select from '@/components/elements/Select';
import isEqual from 'react-fast-compare';
import { ServerContext } from '@/state/server';
import tw from 'twin.macro';
import { Settings, Lock, HelpCircle } from 'lucide-react';

interface Props {
    variable: ServerEggVariable;
}

const VariableBox = ({ variable }: Props) => {
    const FLASH_KEY = `server:startup:${variable.envVariable}`;

    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const [loading, setLoading] = useState(false);
    const [canEdit] = usePermissions(['startup.update']);
    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const { mutate } = getServerStartup(uuid);

    const setVariableValue = debounce((value: string) => {
        setLoading(true);
        clearFlashes(FLASH_KEY);

        updateStartupVariable(uuid, variable.envVariable, value)
            .then(([response, invocation]) =>
                mutate(
                    (data) => ({
                        ...data,
                        invocation,
                        variables: (data.variables || []).map((v) =>
                            v.envVariable === response.envVariable ? response : v
                        ),
                    }),
                    false
                )
            )
            .catch((error) => {
                console.error(error);
                clearAndAddHttpError({ error, key: FLASH_KEY });
            })
            .then(() => setLoading(false));
    }, 500);

    const useSwitch = variable.rules.some(
        (v) => v === 'boolean' || v === 'in:0,1' || v === 'in:1,0' || v === 'in:true,false' || v === 'in:false,true'
    );
    const isStringSwitch = variable.rules.some((v) => v === 'string');
    const selectValues = variable.rules.find((v) => v.startsWith('in:'))?.split(',') || [];

    return (
        <div css={tw`bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 shadow-xl flex flex-col transition-all duration-300 hover:border-zinc-700/50`}>
            <div css={tw`flex items-center justify-between mb-6 pb-4 border-b border-zinc-800/50`}>
                <div css={tw`flex items-center gap-2 text-sm font-semibold text-white uppercase tracking-wider`}>
                    <Settings size={18} className="text-purple-400" />
                    {variable.name}
                </div>
                {!variable.isEditable && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[9px] font-bold uppercase tracking-wider text-amber-500 bg-amber-500/10 border-amber-500/20">
                        <Lock size={10} /> Leitura
                    </span>
                )}
            </div>

            <FlashMessageRender byKey={FLASH_KEY} className='mb-4' />
            
            <div css={tw`flex-1`}>
                <InputSpinner visible={loading}>
                    {useSwitch ? (
                        <div css={tw`bg-zinc-950/50 p-4 rounded-xl border border-zinc-800/50 flex items-center justify-between`}>
                            <p css={tw`text-sm text-zinc-400`}>Estado da Variável</p>
                            <Switch
                                readOnly={!canEdit || !variable.isEditable}
                                name={variable.envVariable}
                                defaultChecked={
                                    isStringSwitch ? variable.serverValue === 'true' : variable.serverValue === '1'
                                }
                                onChange={() => {
                                    if (canEdit && variable.isEditable) {
                                        if (isStringSwitch) {
                                            setVariableValue(variable.serverValue === 'true' ? 'false' : 'true');
                                        } else {
                                            setVariableValue(variable.serverValue === '1' ? '0' : '1');
                                        }
                                    }
                                }}
                            />
                        </div>
                    ) : (
                        <>
                            {selectValues.length > 0 ? (
                                <Select
                                    onChange={(e) => setVariableValue(e.target.value)}
                                    name={variable.envVariable}
                                    defaultValue={variable.serverValue ?? variable.defaultValue}
                                    disabled={!canEdit || !variable.isEditable}
                                >
                                    {selectValues.map((selectValue) => (
                                        <option
                                            key={selectValue.replace('in:', '')}
                                            value={selectValue.replace('in:', '')}
                                        >
                                            {selectValue.replace('in:', '')}
                                        </option>
                                    ))}
                                </Select>
                            ) : (
                                <Input
                                    onKeyUp={(e) => {
                                        if (canEdit && variable.isEditable) {
                                            setVariableValue(e.currentTarget.value);
                                        }
                                    }}
                                    readOnly={!canEdit || !variable.isEditable}
                                    name={variable.envVariable}
                                    defaultValue={variable.serverValue ?? ''}
                                    placeholder={variable.defaultValue}
                                />
                            )}
                        </>
                    )}
                </InputSpinner>
            </div>

            <div css={tw`mt-4 flex items-start gap-2 bg-zinc-950/30 p-3 rounded-lg border border-zinc-800/30`}>
                <HelpCircle size={14} className="text-zinc-600 mt-0.5 shrink-0" />
                <p css={tw`text-xs text-zinc-500 leading-relaxed`}>{variable.description}</p>
            </div>
            <p css={tw`mt-2 text-[10px] font-mono text-zinc-600 uppercase tracking-widest self-end`}>{variable.envVariable}</p>
        </div>
    );
};

export default memo(VariableBox, isEqual);
