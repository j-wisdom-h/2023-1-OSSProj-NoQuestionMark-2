import {useState,useEffect,useRef} from 'react';
import styled from 'styled-components';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import koLocale from '@fullcalendar/core/locales/ko';
import SubjectScheduleAdd from 'Components/SubjectScheduleAdd';
import PersonalScheduleAdd from 'Components/PersonalScheduleAdd';
import PersonalScheduleDetail from 'Components/PersonalScheduleDetail';
import SubjectDetailStudent from 'Components/SubjectDetailStudent';
import SubjectDetailProf from 'Components/SubjectDetailProf';
import { Events,EventSourceInput}  from 'interfaces/CalendarState';
import {subjects} from 'interfaces/homeSchedule';
import { useRecoilValue,useRecoilState } from 'recoil';
import { userInfoState,EventState } from 'recoil/Atom'
import * as Api from 'lib/Api';

const Container = styled.div`
  width : 70%;
  margin : 3rem auto 5rem;
`;
const RightAlign = styled.div`
  display :felx;
  felx-direction : row;
  justify-content : flex-end;

  &:first-child {
      margin-bottom : 2rem;
  }
  &:last-child {
      margin-top : 2rem;
  }
`;
const PostBtn = styled.button<ButtonProps>`
  &:first-child {
      margin-right : 1rem;
  }

  width : 9.5rem;
  height : 2.8rem;
  background-color : ${props => props.btnName === 'personal'? '#6ED746': 'orange'};
  border:none;
  border-radius: 5px;
  color: white;
  padding : 0.2rem;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
`; 
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  btnName: string;
}

const getTodayMonth = () => {
  const Tmonth = String(new Date().getMonth()+1);
  if(Tmonth.length === 1 ) { return `0${Tmonth}`}
  return Tmonth;
}
const getTodayYear = () => {
  return String(new Date().getFullYear());
}
const isStudent = (userType:string|null):boolean => {
  if(userType === "STUDENT") {return true}
  return false;
}

const Calendar = () =>{
  const [subjectList, setSubjectList] =useState<string[]>([]);
  const [postModal, setpostModal] = useState({ personalPost: false, subjectPost: false});
  const [readModal, setReadModal] = useState({ personalRead: false, subjectRead: false});
  const [evt, setEvents] = useState<Events>();
  const [id, setId] = useState('');
  const [month, setMonth] = useState(getTodayMonth);
  const [year, setYear] = useState(getTodayYear);

  const [evtState,setEvtState]= useRecoilState(EventState);
  const userType = useRecoilValue(userInfoState).userType;
  const STUDENT = isStudent(userType);
  const calendarRef = useRef<FullCalendar>(null);

  useEffect (() => {
    console.log(evt);
  },[evt]);

  useEffect(() =>{
    if (!STUDENT){
      (async () => {
        try {
          await Api.get('/home').then((res)=>{
            const result = res.data.result
            const {subjects} = result;
            setSubjectList([...subjects.map((el:subjects)=> el.subjectName)]);
          });
        } catch (error) {
          console.error(error);
        }
      })();
    }
    performGetRequest(year,month);
  },[])

  const performGetRequest = async (year: string, month: string) => {
    try {
      const response = await Api.get(`/schedule/common?month=${year}-${month}`);
      console.log(response);
      const {commonSchedule,subjectSchedule} = response.data.result;
      commonSchedule.map((s:EventSourceInput) => s['type'] = 'personal');
      subjectSchedule.map((s:EventSourceInput) => s['type'] = 'subject');
      const new_Event_List = [...commonSchedule, ...subjectSchedule];
      _getEvents(new_Event_List );
      setEvtState(new_Event_List);

    } catch (error) {
      console.error('Error:', error);
    }
  };

  const _getEvents = async (events: EventSourceInput[]) => {
    setEvents(events.map(el => {return { ...el, 'start': el.startDate, 'end': el.endDate}}));
  }

  // modal
  const handlePostModalToggle = (type:string) => {
    type==='personal' ?
    setpostModal({...postModal, personalPost: !postModal.personalPost})
    :setpostModal({...postModal, subjectPost : !postModal.subjectPost})
  }

  const handleReadModalToggle = (info:any) => {
    let {_def,_instance} = info.event;
    let {title} = _def;
    let {contents, type} = _def.extendedProps;
    setId(_def.extendedProps.scheduleId);
    let {start, end } = _instance.range;

    type === 'personal' ?
    setReadModal({...readModal, personalRead: !readModal.personalRead})
    :setReadModal({...readModal, subjectRead : !readModal.subjectRead})
  }

  return (
      <Container>
        { evt ? 
        <>
        <RightAlign>
          <select name='pets' id='pet-select'>
            <option value=''>--전체보기--</option>
            <option value='subject'>과목일정보기</option>
            <option value='personal'>개인일정보기</option>
          </select>
        </RightAlign>
        <div id='calendar'></div>
        <FullCalendar
          ref={calendarRef}
          plugins={[ dayGridPlugin, timeGridPlugin,interactionPlugin ]}
          initialView='dayGridMonth'
          locale={koLocale}
          customButtons={{
            nextButton: {
              text: '>',
              click: function () {
                const currentMonth = calendarRef.current?.getApi().getDate()?.getMonth() ?? 0;
                const currentYear = calendarRef.current?.getApi().getDate()?.getFullYear() ?? 0;
                const nextMonth = currentMonth + 1;
                const nextYear = currentYear;
                calendarRef.current?.getApi().gotoDate(new Date(nextYear, nextMonth));
                const new_M= (nextMonth + 1).toString().length === 1 ? `0${nextMonth+1}` : `${nextMonth+1}`;
                setMonth(new_M);
                setYear(nextYear.toString());
                performGetRequest(nextYear.toString(), new_M);
              },
            },
            preButton : {
              text: '<',
              click: function () {
                const currentMonth = calendarRef.current?.getApi().getDate()?.getMonth() ?? 0;
                const currentYear = calendarRef.current?.getApi().getDate()?.getFullYear() ?? 0;
                const preMonth = currentMonth - 1;
                const preYear = currentYear;
                calendarRef.current?.getApi().gotoDate(new Date(preYear, preMonth));
                const new_M= (preMonth + 1).toString().length === 1 ? `0${preMonth+1}` : `${preMonth-1}`;
                setMonth(new_M);
                setYear(preYear.toString());
                performGetRequest(preYear.toString(), new_M);
              }
            }
          }}
          headerToolbar= {{
            left: 'preButton,nextButton',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
          }}
          weekends={true}
          eventClick = {handleReadModalToggle}
          events={evt}
        />
        {/* 일정등록모달 */}
        { postModal.personalPost && 
          <PersonalScheduleAdd 
            handleModalToggle={handlePostModalToggle}
            getApi={performGetRequest}
            date={[month,year]}
          /> }
        { postModal.subjectPost && 
          !STUDENT && 
          <SubjectScheduleAdd subjectList={subjectList} handleModalToggle={handlePostModalToggle}/>
        }

        {/* 일정상세보기모달 */}
        { readModal.personalRead && 
          <PersonalScheduleDetail
            handleModalToggle={()=> setReadModal({...readModal, personalRead: !readModal.personalRead})}
            getApi ={performGetRequest}
            id = {id}
            date = {[month,year]}
          /> 
        }
        { readModal.subjectRead && 
          !STUDENT &&
          <SubjectDetailProf
            handleModalToggle={()=> setReadModal({...readModal, subjectRead : !readModal.subjectRead})}
            id = {id}
          /> 
        }
        { readModal.subjectRead && 
          STUDENT &&
          <SubjectDetailStudent
            handleModalToggle={()=> setReadModal({...readModal, subjectRead : !readModal.subjectRead})}
            subjectList={subjectList} 
          /> 
        }

        {/* 일정등록버튼 */}
        <RightAlign>
          {
            !STUDENT && 
            <PostBtn type='button' btnName='subject' onClick={e => handlePostModalToggle('subject')}>과목일정등록하기</PostBtn>
          }
          <PostBtn type='button' btnName='personal' onClick={e => handlePostModalToggle('personal')}>개인일정등록하기</PostBtn>
        </RightAlign>
        </>
        : <h1>Loading</h1>
      }
      </Container>
    )
}

export default Calendar;