'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { functionCatalog, FunctionDefinition, ParameterDefinition } from '@/lib/function-catalog';

interface FunctionSelectorProps {
  onFunctionSelect: (functionData: {
    function: string;
    function_arguments: any[];
    type_arguments: string[];
  }) => void;
  selectedFunction?: string;
}

export function FunctionSelector({ onFunctionSelect, selectedFunction }: FunctionSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedFunc, setSelectedFunc] = useState<FunctionDefinition | null>(null);
  const [parameters, setParameters] = useState<{ [key: string]: any }>({});
  const [typeArguments, setTypeArguments] = useState<string[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const categories = useMemo(() => functionCatalog.getCategories(), []);
  
  const filteredFunctions = useMemo(() => {
    let functions = functionCatalog.getAllFunctions();
    
    if (selectedCategory !== 'all') {
      functions = functionCatalog.getFunctionsByCategory(selectedCategory);
    }
    
    if (searchQuery) {
      functions = functionCatalog.searchFunctions(searchQuery);
    }
    
    return functions;
  }, [searchQuery, selectedCategory]);

  useEffect(() => {
    if (selectedFunction && !selectedFunc) {
      const func = functionCatalog.getFunctionByName(selectedFunction);
      if (func) {
        setSelectedFunc(func);
      }
    }
  }, [selectedFunction, selectedFunc]);

  const handleFunctionClick = (func: FunctionDefinition) => {
    setSelectedFunc(func);
    setParameters({});
    setTypeArguments([]);
    setValidationErrors([]);
  };

  const handleParameterChange = (paramName: string, value: any) => {
    setParameters(prev => ({
      ...prev,
      [paramName]: value,
    }));
  };

  const handleTypeArgumentChange = (index: number, value: string) => {
    const newTypeArgs = [...typeArguments];
    newTypeArgs[index] = value;
    setTypeArguments(newTypeArgs);
  };

  const addTypeArgument = () => {
    setTypeArguments(prev => [...prev, '']);
  };

  const removeTypeArgument = (index: number) => {
    setTypeArguments(prev => prev.filter((_, i) => i !== index));
  };

  const handleUseExample = (example: any) => {
    setParameters(example.parameters);
  };

  const handleSubmit = () => {
    if (!selectedFunc) return;

    const validation = functionCatalog.validateParameters(selectedFunc, parameters);
    
    if (!validation.valid) {
      setValidationErrors(validation.errors);
      return;
    }

    const functionArgs = selectedFunc.parameters.map(param => 
      parameters[param.name] !== undefined ? parameters[param.name] : param.defaultValue
    );

    onFunctionSelect({
      function: `${selectedFunc.module}::${selectedFunc.functionName}`,
      function_arguments: functionArgs,
      type_arguments: typeArguments.filter(arg => arg.trim() !== ''),
    });
  };

  const renderParameterInput = (param: ParameterDefinition) => {
    const value = parameters[param.name] || '';
    
    switch (param.type) {
      case 'bool':
        return (
          <select
            value={value}
            onChange={(e) => handleParameterChange(param.name, e.target.value === 'true')}
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="">Select...</option>
            <option value="true">true</option>
            <option value="false">false</option>
          </select>
        );
      
      case 'String':
        return (
          <Input
            type="text"
            value={value}
            onChange={(e) => handleParameterChange(param.name, e.target.value)}
            placeholder={param.description}
          />
        );
      
      case 'u64':
      case 'u128':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => handleParameterChange(param.name, e.target.value)}
            placeholder={param.description}
            min="0"
          />
        );
      
      case 'address':
        return (
          <Input
            type="text"
            value={value}
            onChange={(e) => handleParameterChange(param.name, e.target.value)}
            placeholder="0x..."
            pattern="^0x[a-fA-F0-9]{1,64}$"
          />
        );
      
      default:
        return (
          <Textarea
            value={value}
            onChange={(e) => handleParameterChange(param.name, e.target.value)}
            placeholder={param.description}
            rows={2}
          />
        );
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4">Function Selector</h3>
        
        {/* Search and filters */}
        <div className="space-y-3 mb-4">
          <Input
            type="text"
            placeholder="Search functions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1 rounded-full text-sm ${
                selectedCategory === 'all'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              All ({functionCatalog.getAllFunctions().length})
            </button>
            {categories.map(cat => (
              <button
                key={cat.name}
                onClick={() => setSelectedCategory(cat.name)}
                className={`px-3 py-1 rounded-full text-sm ${
                  selectedCategory === cat.name
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {cat.label} ({cat.count})
              </button>
            ))}
          </div>
        </div>

        {/* Function list */}
        <div className="max-h-60 overflow-y-auto space-y-2 mb-4">
          {filteredFunctions.map((func) => (
            <div
              key={`${func.module}::${func.functionName}`}
              onClick={() => handleFunctionClick(func)}
              className={`p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                selectedFunc?.module === func.module && selectedFunc?.functionName === func.functionName
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200'
              }`}
            >
              <div className="font-medium">{func.module}::{func.functionName}</div>
              <div className="text-sm text-gray-600">{func.description}</div>
              <div className="flex items-center justify-between mt-2">
                <span className={`text-xs px-2 py-1 rounded ${
                  func.category === 'defi' ? 'bg-green-100 text-green-800' :
                  func.category === 'nft' ? 'bg-purple-100 text-purple-800' :
                  func.category === 'governance' ? 'bg-blue-100 text-blue-800' :
                  func.category === 'utility' ? 'bg-gray-100 text-gray-800' :
                  'bg-orange-100 text-orange-800'
                }`}>
                  {func.category}
                </span>
                <span className="text-xs text-gray-500">~{func.gasEstimate} gas</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Function details and parameter input */}
      {selectedFunc && (
        <Card className="p-4">
          <h4 className="text-lg font-semibold mb-2">
            {selectedFunc.module}::{selectedFunc.functionName}
          </h4>
          <p className="text-gray-600 mb-4">{selectedFunc.description}</p>

          {/* Type arguments */}
          {typeArguments.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Type Arguments</label>
              {typeArguments.map((arg, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <Input
                    type="text"
                    value={arg}
                    onChange={(e) => handleTypeArgumentChange(index, e.target.value)}
                    placeholder="Type argument (e.g., 0x1::aptos_coin::AptosCoin)"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeTypeArgument(index)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
          
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addTypeArgument}
            className="mb-4"
          >
            Add Type Argument
          </Button>

          {/* Parameters */}
          {selectedFunc.parameters.length > 0 && (
            <div className="space-y-4 mb-4">
              <h5 className="font-medium">Parameters</h5>
              {selectedFunc.parameters.map((param) => (
                <div key={param.name} className="space-y-2">
                  <label className="block text-sm font-medium">
                    {param.name}
                    {param.required && <span className="text-red-500 ml-1">*</span>}
                    <span className="ml-2 text-xs text-gray-500">({param.type})</span>
                  </label>
                  {renderParameterInput(param)}
                  {param.description && (
                    <p className="text-xs text-gray-600">{param.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Examples */}
          {selectedFunc.examples.length > 0 && (
            <div className="mb-4">
              <h5 className="font-medium mb-2">Examples</h5>
              <div className="space-y-2">
                {selectedFunc.examples.map((example, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{example.name}</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleUseExample(example)}
                      >
                        Use Example
                      </Button>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{example.description}</p>
                    <div className="text-xs text-gray-500">{example.expectedOutcome}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Validation errors */}
          {validationErrors.length > 0 && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <h6 className="font-medium text-red-800 mb-2">Validation Errors:</h6>
              <ul className="text-sm text-red-700 space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          <Button onClick={handleSubmit} className="w-full">
            Use This Function
          </Button>
        </Card>
      )}
    </div>
  );
}