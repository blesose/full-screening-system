import { useApplicants } from "./features/applicants/hooks/useApplicants";

function App() {
  const {
    data: applicants,
    isLoading,
    isError
  } = useApplicants();
  if(isLoading) {
    return <div> loading .... applicnts fetched</div>
  }

  if(isError) {
    return <div>error .. failed to load applicnts</div>
  }

  return (
    <main>
      <h1>Applicants</h1>
      <ul>
        {applicants?.map((applicant) => (
          <li key={applicant.id}>
            {applicant.firstName} {applicant.lastName}
          </li>
        ))}
      </ul>
    </main>
  );
}

export default App;