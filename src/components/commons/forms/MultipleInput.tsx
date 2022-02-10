import * as React from 'react';
import { InputTypeProperties, convertInputValue, parseInputValue, generateInputProperties } from '../XForm';
import { Form } from 'semantic-ui-react';
import xhelper from '../../../helpers/xhelper';
import classNames = require('classnames');
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

export function XMultipleInput(props: InputTypeProperties) {
  const [values, setValues] = React.useState((props.value || []).map(v => convertInputValue(props.dataType.valueType, v)));
  React.useEffect(() => {
    setValues((props.value || []).map(v => convertInputValue(props.dataType.valueType, v)));
  }, [props.value]);
  const [isActive, setActive] = React.useState(false);

  React.useEffect(() => {
    const inActive = () => {
      setActive(false);
    };
    document.addEventListener('click', inActive);
    return () => {
      document.removeEventListener('click', inActive);
    };
  }, []);

  const inputRef = React.useRef(null);
  const sizerRef = React.useRef(null);

  return (
    <Form.Field>
      <DragDropContext
        onDragEnd={result => {
          if (!result.destination) {
            return;
          }
          props.onChange(props.name, xhelper.reorder(values, result.source.index, result.destination.index));
        }}
      >
        <Droppable droppableId="droppable" direction="horizontal">
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              role="combobox"
              className={classNames('ui fluid multiple search selection dropdown', {
                active: isActive
              })}
              onClick={e => {
                e.nativeEvent.stopImmediatePropagation();
                setActive(true);
                inputRef.current.focus();
              }}
            >
              {values &&
                values.map((v, i) => (
                  <Draggable key={i} draggableId={i} index={i}>
                    {(provided, snapshot) => (
                      <a
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        style={{
                          ...provided.draggableProps.style,
                          opacity: snapshot.isDragging ? 0.618 : 1
                        }}
                        className="ui label"
                      >
                        {v}
                        <i
                          aria-hidden="true"
                          className="delete icon"
                          onClick={e =>
                            props.onChange(
                              props.name,
                              values.filter((oo, ii) => i !== ii)
                            )
                          }
                        ></i>
                      </a>
                    )}
                  </Draggable>
                ))}
              <input
                {...generateInputProperties(props.dataType)}
                autoComplete={false}
                className="search"
                onKeyPress={e => {
                  if (e.nativeEvent.keyCode === 13) {
                    e.nativeEvent.preventDefault();

                    const input = e.nativeEvent.target as HTMLInputElement;

                    props.onChange(props.name, [...values, parseInputValue(input, props.dataType.valueType)]);

                    input.value = '';
                  }
                }}
                onChange={e => {
                  const searchQuery = e.target.value;
                  if (sizerRef.current && searchQuery) {
                    sizerRef.current.style.display = 'inline';
                    sizerRef.current.textContent = searchQuery;
                    const searchWidth = Math.ceil(sizerRef.current.getBoundingClientRect().width);
                    sizerRef.current.style.removeProperty('display');

                    inputRef.current.style.width = searchWidth + 'px';
                  } else {
                    inputRef.current.style.width = '';
                  }
                }}
                ref={inputRef}
              ></input>
              <span ref={sizerRef} className="sizer"></span>
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </Form.Field>
  );
}
