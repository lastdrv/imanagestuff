import axios from 'axios';
import '../home/home.scss';
import './logwork.scss';
import React, {useState, useEffect} from 'react';
import {durationToHours} from 'app/shared/util/date-utils';
import {Translate} from 'react-jhipster';
import {connect} from 'react-redux';
import {MemberList, ProjectList, TimeEntries} from "app/modules/logwork/logwork-components";
import {
  Button,
  Row,
  Col,
  Form,
  FormGroup,
  Label
} from 'reactstrap';
import {IRootState} from 'app/shared/reducers';
import project from "app/entities/project/project";
import {cleanEntity} from "app/shared/util/entity-utils";

export type ILogWorkProp = StateProps;

export const LogWork = (props: ILogWorkProp) => {
  const {account} = props;
  const [projects, setProjects] = useState([]);
  const [isDefaultProject, setIsDefaultProject] = useState(false);
  const [currentProject, setCurrentProject] = useState(null);
  const [currentMember, setCurrentMember] = useState(null);
  const [reportDate, setReportDate] = useState(new Date().toISOString().substr(0, 10));
  const [entries, setEntries] = useState(null);
  const [duration, setDuration] = useState(null);
  const [entryDescription, setEntryDescription] = useState(null);
  const [totalHours, setTotalHours] = useState(0);

  useEffect(() => {
    if (!account.login) {
      return;
    }
    axios.get("api/projects/current").then(response => {
      setProjects(response.data);
      const mem = response.data[0].members.find(m => m.login === account.login);
      const dProject = response.data.find(p => p.id === mem.defaultProjectId)
      setCurrentProject(dProject ? dProject : response.data[0]);
      setCurrentMember(mem);
    })
  }, [account])

  useEffect(() =>{
    setIsDefaultProject(currentProject?.id === currentMember?.defaultProjectId)
  })

  function updateEntries() {
    axios.get("api/time-entries/of/" + currentMember.id + '/in/' + currentProject.id + '?date=' + reportDate).then(response => {
      setEntries(response.data);
    });
  }

  useEffect(() => {
    if (!currentMember || !reportDate) {
      return;
    }
    updateEntries();

  }, [currentMember, currentProject, reportDate])

  useEffect(() => {
    if (!entries || entries.length < 1) {
      return;
    }
    let sum = 0;
    entries.forEach(e => {
      sum = sum + durationToHours(e.duration);
    });
    setTotalHours(sum);
  }, [entries])

  const updateCurrentProject = selectedProject => {
    setCurrentProject(selectedProject);
  }

  const updateCurrentMember = member => {
    setCurrentMember(member);
  }

  function formatDuration(durationToFormat) {
    return durationToFormat.toUpperCase()
      .replace(/ /g, '')
      .replace(/В/g, 'D')
      .replace(/Д/g, 'D')
      .replace(/Р/g, 'H')
      .replace(/Ч/g, 'H')
      .replace(/Ь/g, 'M')
      .replace(/М/g, 'M')
  }

  const addNewEntry = () => {
    const entity = {
      duration: 'PT' + formatDuration(duration),
      shortDescription: entryDescription,
      projectId: currentProject.id,
      memberId: currentMember.id,
      date: reportDate
    };
    axios.post('api/time-entries/', cleanEntity(entity)).then(result => {
      updateEntries();
      setEntryDescription("");
      setDuration("");
    });
  }

  const updateDefaultProjectForMembers = () => {
    const mem = currentMember
    mem.defaultProjectId = currentProject.id
    mem.defaultProjectName = currentProject.name
    axios.put('/api/members', mem)
    setIsDefaultProject(true)
  };


  return (
    <Row>
      <Col md="9">
        <h2>
          <Translate contentKey="logwork.title">Log Your Work Every Day</Translate>
        </h2>
        <p className="lead">
          <Translate contentKey="logwork.subtitle">This is your duty</Translate>
        </p>
        {currentMember ? (
          <h5>{currentMember?.firstName + ' ' + currentMember?.lastName + '(' + currentMember.login + ')'}</h5>) : (
          <p></p>)}
          <Row class="form-row">
            <ProjectList projects={projects} value={currentProject}
                         handler={updateCurrentProject}
                         isDefaultProject={isDefaultProject}
                         updateDefaultProject={updateDefaultProjectForMembers}
                         showButton={true}/>
            <MemberList project={currentProject} value={currentMember} handler={updateCurrentMember}/>
          </Row>
          <FormGroup>
            <Label>Дата:</Label>
            <input type="date" name="reportDate" class-name="form-control" defaultValue={reportDate} value={reportDate}
                   onChange={event => setReportDate(event.target.value)}/>
          </FormGroup>
        <Row>
          <Form className="jumbotron">
            <h3>Добавить задачу</h3>
            <Row className='align-items-center'>
              <FormGroup className='col-auto'>
                <Label className="sr-only" for='description'>Описание</Label>
                <textarea name='description'
                          id="description"
                          className='form-control logwork'
                          placeholder="Описание"
                          value={entryDescription}
                          onChange={event => setEntryDescription(event.target.value)}>
                </textarea>
              </FormGroup>
              <FormGroup className='col-auto'>
                <Label className="sr-only" for={'logwork'}>Время</Label>
                <input type="text"
                       name='logwork'
                       className='form-control'
                       id="logwork"
                       placeholder="Время"
                       value={duration}
                       onChange={e => setDuration(e.target.value)}
                />
              </FormGroup>
              <FormGroup className='col-auto'>
                <Button className='btn-primary' onClick={event => {
                  addNewEntry();
                  return false;
                }}>+</Button>
              </FormGroup>
            </Row>
          </Form>
        </Row>
        <Row>
          <TimeEntries entries={entries} member={currentMember}/>
        </Row>
      </Col>
    </Row>
  );
};

const mapStateToProps = storeState => ({
  account: storeState.authentication.account,
  isAuthenticated: storeState.authentication.isAuthenticated,
});

type StateProps = ReturnType<typeof mapStateToProps>;

export default connect(mapStateToProps)(LogWork);
